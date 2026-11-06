import { expect, test, type Page } from "@playwright/test";
import "dotenv/config";
import pg from "pg";
import type { MealPlan } from "../../src/lib/domain/types";

async function finishOnboarding(page: Page): Promise<MealPlan> {
  await page.goto("/onboarding");
  await page.getByText("Coral Hipermercados", { exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("spinbutton", { name: "Presupuesto máximo en dólares" }).fill("50");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("radio", { name: "7 días", exact: true }).locator("..").click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const people = Number(await page.locator(".counter output").textContent());
  for (let n = people; n > 2; n--) await page.getByRole("button", { name: "Menos personas" }).click();
  for (let n = people; n < 2; n++) await page.getByRole("button", { name: "Más personas" }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const selected = page.locator(".choice-chip[aria-pressed='true']");
  while (await selected.count()) await selected.first().click();
  await page.getByRole("button", { name: "Alto en proteína", exact: true }).click();
  await page.getByRole("button", { name: "Saludable", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const none = page.getByRole("button", { name: "No tengo alergias", exact: true });
  if (await none.getAttribute("aria-pressed") === "false") await none.click();
  await expect(page.getByRole("button", { name: "Lactosa", exact: true })).toBeDisabled();
  await none.click(); await page.getByRole("button", { name: "Lactosa", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const remove = page.getByRole("button", { name: /^Quitar / });
  while (await remove.count()) await remove.first().click();
  await page.getByRole("textbox", { name: "Ingrediente a evitar" }).fill("Brócoli");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  const responsePromise = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/plans");
  await page.getByRole("button", { name: "Generar mi plan", exact: true }).click();
  const response = await responsePromise; expect(response.status()).toBe(201);
  const { plan } = await response.json() as { plan: MealPlan };
  await expect(page).toHaveURL(/\/$/); await expect(page.getByRole("heading", { name: /Qué bien tenerte|¡Tu plan está listo/ })).toBeVisible();
  return plan;
}
const nav = (page: Page) => page.getByRole("navigation", { name: "Navegación principal", exact: true }).or(page.getByRole("navigation", { name: "Navegación principal móvil", exact: true })).filter({ visible: true });

test("onboarding Coral $50, F5, compra persistente y comprobación en PostgreSQL", async ({ page }, testInfo) => {
  const errors: string[] = []; page.on("pageerror", (e) => errors.push(e.message));
  const plan = await finishOnboarding(page);
  expect(plan.preferences).toMatchObject({ market: "Coral Hipermercados", budget: 50, days: 7, people: 2, allergies: ["Lactosa"], avoidedItems: ["Brócoli"] });
  expect(plan.preferences.goals.sort()).toEqual(["Alto en proteína", "Saludable"].sort()); expect(plan.meals).toHaveLength(7);
  await page.evaluate(() => localStorage.clear()); await page.reload();
  await expect(page.getByRole("heading", { name: /Qué bien tenerte|¡Tu plan está listo/ })).toBeVisible();
  const reloaded = await (await page.request.get(`/api/plans/${plan.id}`)).json(); expect(reloaded.plan).toEqual(plan);
  await nav(page).getByRole("link", { name: "Compras", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Todo para tu semana.", exact: true })).toBeVisible();
  await page.getByRole("checkbox").first().click(); await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page.reload(); await expect(page.getByRole("checkbox").first()).toBeChecked();
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    const { rows: [stored] } = await db.query(`SELECT p."presupuesto"::float AS budget, p."dias", p."personas", s."nombre" AS store,
      (SELECT count(*)::int FROM "PlanMeal" m WHERE m."planId" = p."id") AS meals,
      (SELECT array_agg(v."nombre" ORDER BY v."nombre") FROM "PlanPreference" x JOIN "Preference" v ON v."id"=x."preferenceId" WHERE x."planId"=p."id") AS preferences,
      (SELECT array_agg(a."nombre") FROM "PlanAllergy" x JOIN "Allergy" a ON a."id"=x."allergyId" WHERE x."planId"=p."id") AS allergies,
      (SELECT array_agg(x."nombre") FROM "PlanExcludedIngredient" x WHERE x."planId"=p."id") AS exclusions,
      (SELECT i."checked" FROM "ShoppingList" l JOIN "ShoppingItem" i ON i."shoppingListId"=l."id" JOIN "Product" v ON v."id"=i."productId" WHERE l."planId"=p."id" ORDER BY v."nombre" LIMIT 1) AS purchased
      FROM "MealPlan" p JOIN "Store" s ON s."id"=p."storeId" WHERE p."id"=$1`, [plan.id]);
    expect(stored.store).toBe("Coral Hipermercados"); expect(stored.budget).toBe(50); expect(stored.dias).toBe(7); expect(stored.personas).toBe(2); expect(stored.meals).toBe(7);
    expect(stored.preferences.sort()).toEqual(["Alto en proteína", "Saludable"].sort()); expect(stored.allergies).toEqual(["Lactosa"]); expect(stored.exclusions).toEqual(["Brócoli"]); expect(stored.purchased).toBe(true);
  } finally { await db.end(); }
  expect(await page.evaluate(() => Object.keys(localStorage).some((key) => /react\.v1|userState|currentPlan/.test(key)))).toBe(false);
  expect(errors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("compras-postgresql.png"), fullPage: true });
});

test("semana, recetas, perfil y tema conservan sus funciones con datos del servidor", async ({ page }) => {
  const plan = await finishOnboarding(page);
  await nav(page).getByRole("link", { name: "Semana", exact: true }).click(); await expect(page.getByRole("heading", { name: "Tu semana, resuelta.", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Marcar comida del día 1 como preparada", exact: true }).click();
  await expect(page.getByRole("button", { name: "Desmarcar comida del día 1 como preparada", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Ver receta", exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole("heading", { name: "Ingredientes", exact: true })).toBeVisible(); await page.getByRole("button", { name: "Cerrar ventana" }).click();
  await page.reload(); await expect(page.getByRole("button", { name: "Desmarcar comida del día 1 como preparada", exact: true })).toBeVisible();
  await nav(page).getByRole("link", { name: "Recetas", exact: true }).click(); await expect(page.getByRole("heading", { name: "Un poco de inspiración.", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Buscar recetas" }).fill("ZZZsinreceta"); await expect(page.getByText("No encontramos esa receta", { exact: true })).toBeVisible();
  await nav(page).getByRole("link", { name: "Perfil", exact: true }).click(); await expect(page.getByRole("heading", { name: "Un plan que va contigo.", exact: true })).toBeVisible();
  const profile = await (await page.request.get("/api/profile")).json();
  await page.getByRole("textbox", { name: "¿Cómo te llamas?" }).fill("Perfil de desarrollo"); await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Perfil guardado" })).toBeVisible();
  await page.getByRole("switch", { name: "Tema oscuro" }).click(); await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Editar filtros y preferencias" }).click(); await page.getByRole("spinbutton", { name: "Presupuesto máximo en dólares" }).fill("99");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click(); await page.reload();
  await expect(page.getByRole("textbox", { name: "¿Cómo te llamas?" })).toHaveValue("Perfil de desarrollo"); await expect(page.getByText("$50.00", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect((await (await page.request.get(`/api/plans/${plan.id}`)).json()).plan.meals[0].prepared).toBe(true);
  await page.request.patch("/api/profile", { data: { name: profile.profile.name } });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test("el catálogo muestra loading, error, reintento y vacío sin opciones inventadas", async ({ page }) => {
  await page.route("**/api/stores", async (route) => { await new Promise((resolve) => setTimeout(resolve, 400)); await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "No pudimos cargar los supermercados." }) }); });
  await page.goto("/onboarding");
  await expect(page.getByText("No pudimos cargar los supermercados.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
  await page.unroute("**/api/stores"); await page.getByRole("button", { name: "Volver a intentar", exact: true }).click();
  await expect(page.getByText("Coral Hipermercados", { exact: true })).toBeVisible();
  await page.route("**/api/stores", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ stores: [] }) }));
  await page.reload(); await expect(page.getByText("No hay opciones disponibles en este momento.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
});

test("una compra no se marca si falla el PATCH; se puede reintentar", async ({ page }) => {
  await finishOnboarding(page);
  await nav(page).getByRole("link", { name: "Compras", exact: true }).click(); await expect(page.getByRole("heading", { name: "Todo para tu semana.", exact: true })).toBeVisible();
  await page.route("**/api/shopping-items/*", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "No se pudo guardar la compra." }) }));
  await page.getByRole("checkbox").first().click(); await expect(page.getByText("No se pudo guardar la compra.", { exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  await page.unroute("**/api/shopping-items/*"); await page.getByRole("checkbox").first().click(); await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page.reload(); await expect(page.getByRole("checkbox").first()).toBeChecked();
});

test("el ajuste de presupuesto se calcula y se guarda en el servidor", async ({ page }) => {
  const original = await finishOnboarding(page);
  await page.getByRole("button", { name: "Abrir filtros y preferencias" }).click();
  await page.getByRole("spinbutton", { name: "Presupuesto máximo en dólares" }).fill("20");
  await page.locator("summary").filter({ hasText: "Días y personas" }).click();
  for (let n = 2; n < 12; n++) await page.getByRole("button", { name: "Más personas" }).click();
  await page.getByRole("button", { name: "Generar nuevo plan", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ajustemos tu presupuesto", exact: true })).toBeVisible();
  const response = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/api/plans" && r.status() === 201);
  await page.getByRole("button", { name: "Reducir días para que alcance" }).click();
  const { plan } = await (await response).json() as { plan: MealPlan };
  expect(plan.total).toBeLessThanOrEqual(20); expect(plan.preferences.days).toBeLessThan(7); expect(plan.preferences.people).toBe(12);
  expect(plan.preferences.allergies).toEqual(["Lactosa"]); expect(plan.preferences.avoidedItems).toEqual(["Brócoli"]);
  expect((await (await page.request.get(`/api/plans/${original.id}`)).json()).plan.preferences.budget).toBe(50);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.reload(); await expect(page.getByRole("heading", { name: /Qué bien tenerte|¡Tu plan está listo/ })).toBeVisible();
  expect((await (await page.request.get("/api/plans")).json()).plan.id).toBe(plan.id);
});
