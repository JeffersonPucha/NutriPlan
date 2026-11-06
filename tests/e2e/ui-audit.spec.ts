import { expect, test, type Page, type Route } from "@playwright/test";
import type { MealPlan } from "../../src/lib/domain/types";

// UI checks may read PostgreSQL through GET. All writes are intercepted.
const fulfill = (route: Route, body: unknown, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
let blockedWrites: string[];
test.beforeEach(async ({ page }) => {
  blockedWrites = [];
  await page.route("**/api/**", async (route) => {
    if (route.request().method() === "GET") return route.continue();
    blockedWrites.push(`${route.request().method()} ${new URL(route.request().url()).pathname}`);
    return fulfill(route, { message: "La auditoría no permite escrituras en PostgreSQL." }, 405);
  });
});
test.afterEach(() => expect(blockedWrites).toEqual([]));
const open = async (page: Page, url: string) => { await page.goto(url); await expect(page.locator("main h1:visible")).toBeVisible(); };
const next = (page: Page) => page.getByRole("button", { name: "Continuar", exact: true }).click();
const current = async (page: Page): Promise<MealPlan> => (await (await page.request.get("/api/plans")).json()).plan;
const fits = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);

test("la navegación y las cinco pantallas mantienen sus acciones sin desbordarse", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  for (const path of ["/", "/semana", "/compras", "/recetas", "/perfil"]) {
    await open(page, path); await fits(page);
    await expect(page.getByRole("navigation").filter({ visible: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Abrir filtros y preferencias", exact: true })).toHaveCount(1);
    expect(await page.locator("main button").evaluateAll((buttons) => buttons.filter((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && (rect.width < 44 || rect.height < 44);
    }).map((button) => button.getAttribute("aria-label") || button.textContent))).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test("onboarding: ocho pasos, una decisión por pantalla y edición precisa del resumen", async ({ page }) => {
  await open(page, "/onboarding");
  await page.getByText("Coral Hipermercados", { exact: true }).click(); await next(page);
  await page.getByRole("spinbutton", { name: "Presupuesto máximo en dólares" }).fill("50"); await next(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Cuántos días quieres planificar?");
  await expect(page.getByRole("button", { name: "Más personas" })).toHaveCount(0);
  await page.getByRole("radio", { name: "7 días", exact: true }).focus(); await page.keyboard.press("Space"); await next(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Para cuántas personas?");
  await expect(page.getByRole("radio")).toHaveCount(0);
  let people = Number(await page.locator(".counter output").textContent());
  while (people > 2) { await page.getByRole("button", { name: "Menos personas" }).click(); people--; }
  while (people < 2) { await page.getByRole("button", { name: "Más personas" }).click(); people++; }
  await next(page); await expect(page.locator("main h1")).toBeFocused();
  await next(page);
  const none = page.getByRole("button", { name: "No tengo alergias", exact: true });
  if (await none.getAttribute("aria-pressed") === "false") await none.click();
  await expect(page.getByRole("button", { name: "Lactosa", exact: true })).toBeDisabled();
  await none.click(); await page.getByRole("button", { name: "Lactosa", exact: true }).click(); await next(page);
  await expect(page.getByRole("button", { name: "Agregar", exact: true })).toBeDisabled();
  const broccoli = page.getByRole("button", { name: "Brócoli", exact: true });
  if (await broccoli.count()) await broccoli.click();
  await expect(page.getByRole("button", { name: "Quitar Brócoli", exact: true })).toBeVisible();
  await expect(broccoli).toHaveCount(0); await next(page);
  await expect(page.getByText("Paso 8 de 8", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Editar personas", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("¿Para cuántas personas?");
  for (let step = 0; step < 4; step++) await next(page);
  let payload: Record<string, unknown> = {};
  await page.route("**/api/plans", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    payload = route.request().postDataJSON();
    return fulfill(route, { message: "Prueba de interfaz: el plan no se escribió en la base." }, 503);
  });
  await page.getByRole("button", { name: "Generar mi plan", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "no se escribió" })).toBeVisible();
  expect(payload).toMatchObject({ budget: 50, days: 7, people: 2 }); expect(payload).not.toHaveProperty("userId");
  await expect(page.getByRole("button", { name: "Generar mi plan", exact: true })).toBeEnabled();
});

test("Semana conserva el día activo al navegar y al entrar desde Inicio", async ({ page }) => {
  const plan = await current(page); const last = plan.meals.length - 1;
  await open(page, "/");
  await page.getByRole("link", { name: /^Ver día 1:/ }).click();
  await expect(page).toHaveURL(/\/semana#dia-0$/);
  await expect(page.locator(".week-screen #dia-0")).toBeInViewport();
  await expect(page.locator("#dia-0")).toHaveCount(1);
  await open(page, `/semana#dia-${last}`);
  const selected = page.getByRole("button", { name: new RegExp(`^Día ${last + 1}:`) });
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`#dia-${last}`)).toBeInViewport();
  await expect(page.locator(`#dia-${last} .eyebrow`)).toContainText("·");
  await page.getByRole("button", { name: /^Día 1:/ }).click();
  await expect(page.getByRole("button", { name: /^Día 1:/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#dia-0")).toBeInViewport();
  await fits(page);
});

test("Compras comunica guardado pendiente y errores sin perder legibilidad", async ({ page }) => {
  const plan = await current(page); plan.shopping[0].checked = false;
  await page.route("**/api/plans", (route) => fulfill(route, { plan }));
  let fail = false;
  await page.route("**/api/shopping-items/*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return fail ? fulfill(route, { message: "No se pudo guardar la compra." }, 500) : fulfill(route, { item: { id: plan.shopping[0].id, purchased: true } });
  });
  await open(page, "/compras"); const box = page.getByRole("checkbox").first();
  await box.focus(); await page.keyboard.press("Space"); await expect(box).toBeDisabled();
  await expect(box).toBeChecked(); await expect(box).toBeEnabled();
  expect(await page.locator(".shopping-row").first().evaluate((row) => getComputedStyle(row).opacity)).toBe("1");
  fail = true; await box.click(); await expect(page.getByRole("alert").filter({ hasText: "No se pudo guardar" })).toBeVisible(); await expect(box).toBeChecked();
  await page.getByRole("button", { name: "Cerrar aviso de operación" }).click(); await expect(page.locator(".storage-alert")).toHaveCount(0);
});

test("Recetas: búsqueda anunciada y diálogo accesible con retorno de foco", async ({ page }) => {
  await open(page, "/recetas"); const search = page.getByRole("textbox", { name: "Buscar recetas" });
  await search.fill("sincoincidencia000"); await expect(page.getByRole("status")).toHaveText("0 resultados");
  await expect(page.getByText("No encontramos esa receta", { exact: true })).toBeVisible(); await search.fill("");
  const recipe = page.locator(".recipe-tile").first(); await recipe.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible(); await expect(page.getByRole("heading", { name: "Ingredientes", exact: true })).toBeVisible();
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0); await expect(recipe).toBeFocused();
  await recipe.hover(); expect(await recipe.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
});

test("Filtros permite editar por secciones y cancelar sin guardar", async ({ page }) => {
  await open(page, "/"); const original = await current(page);
  const trigger = page.getByRole("button", { name: "Abrir filtros y preferencias" }); await trigger.click();
  const dialog = page.getByRole("dialog"); await expect(dialog.locator("details")).toHaveCount(6);
  await expect(dialog.getByRole("spinbutton", { name: "Presupuesto máximo en dólares" })).toBeVisible();
  await dialog.getByRole("spinbutton").fill("75");
  await dialog.locator("summary").filter({ hasText: "Días y personas" }).click(); await expect(dialog.getByRole("button", { name: "Más personas" })).toBeVisible();
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click(); await expect(trigger).toBeFocused();
  expect(await current(page)).toEqual(original);
});

const contrast = (first: string, second: string) => {
  const luminance = (value: string) => {
    const parts = value.match(/\d+(?:\.\d+)?/g)!.slice(0, 3).map(Number).map((n) => { const c = n / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
    return parts[0] * .2126 + parts[1] * .7152 + parts[2] * .0722;
  };
  const [low, high] = [luminance(first), luminance(second)].sort((a, b) => a - b); return (high + .05) / (low + .05);
};
test("contraste, movimiento reducido y contenido largo entre 320 y 1440 px", async ({ page }) => {
  test.setTimeout(90000);
  const plan = await current(page);
  plan.preferences.avoidedItems = ["Preparaciones con salsas de tomate y condimentos muy picantes"];
  plan.meals[0].recipe.name = "Pollo al horno con vegetales de temporada y ensalada de aguacate";
  await page.route("**/api/plans", (route) => fulfill(route, { plan }));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ["/", "/semana", "/compras", "/recetas", "/perfil", "/onboarding"]) { await open(page, path); await fits(page); }
  }
  await open(page, "/perfil");
  for (const dark of [false, true]) {
    if (dark) await page.getByRole("switch", { name: "Tema oscuro" }).click();
    const colors = await page.evaluate(() => {
      const probe = document.createElement("span"); document.body.append(probe);
      const color = (token: string) => { probe.style.color = `var(${token})`; return getComputedStyle(probe).color; };
      const values = Object.fromEntries(["--text-secondary", "--background", "--surface", "--muted", "--control-border"].map((token) => [token, color(token)])); probe.remove(); return values;
    });
    for (const background of ["--background", "--surface", "--muted"]) expect(contrast(colors["--text-secondary"], colors[background])).toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors["--control-border"], colors["--surface"])).toBeGreaterThanOrEqual(3);
    expect(await page.locator(".theme-switch span").evaluate((element) => getComputedStyle(element).transitionDuration)).toBe("0s");
  }
});
