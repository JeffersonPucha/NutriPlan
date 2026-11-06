import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createDatabaseClient } from "./database-client";
import type { Catalogs, MealPlan, Profile } from "../src/lib/domain/types";
import { Prisma } from "../src/generated/prisma/client";
const base = process.env.NUTRIPLAN_API_URL || "http://127.0.0.1:3000";
const db = createDatabaseClient();
async function call<T>(path: string, method = "GET", body?: unknown, status = 200): Promise<T> {
  const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  const value = await response.json(); assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(value)}`);
  assert.ok(response.headers.get("cache-control")?.includes("no-store")); return value as T;
}
async function checkApi() {
  assert.deepEqual(await call("/api/health"), { status: "ok", database: "connected" });
  const { stores } = await call<{ stores: Catalogs["stores"] }>("/api/stores");
  const { preferences } = await call<{ preferences: Catalogs["preferences"] }>("/api/preferences");
  const { allergies } = await call<{ allergies: Catalogs["allergies"] }>("/api/allergies");
  const { products } = await call<{ products: Catalogs["products"] }>("/api/products");
  const { profile } = await call<{ profile: Profile }>("/api/profile");
  const store = stores.find((s) => s.nombre === "Coral Hipermercados")!;
  const input = { storeId: store.id, budget: 50, days: 7, people: 2,
    preferenceIds: ["Alto en proteína", "Saludable"].map((name) => preferences.find((p) => p.nombre === name)!.id),
    allergyIds: [allergies.find((a) => a.nombre === "Lactosa")!.id], excludedIngredients: ["Brócoli"], requestKey: randomUUID() };
  const countBefore = await db.mealPlan.count();
  const { plan } = await call<{ plan: MealPlan }>("/api/plans", "POST", input, 201);
  assert.equal(plan.preferences.market, store.nombre); assert.equal(plan.preferences.budget, 50); assert.equal(plan.meals.length, 7);
  assert.deepEqual(plan.preferences.goals.slice().sort(), ["Alto en proteína", "Saludable"].sort()); assert.deepEqual(plan.preferences.allergies, ["Lactosa"]); assert.deepEqual(plan.preferences.avoidedItems, ["Brócoli"]);
  const duplicate = await call<{ plan: MealPlan }>("/api/plans", "POST", input); assert.equal(duplicate.plan.id, plan.id);
  assert.equal(await db.mealPlan.count(), countBefore + 1);
  assert.deepEqual((await call<{ plan: MealPlan }>(`/api/plans/${plan.id}`)).plan, plan);
  assert.equal((await call<{ plan: MealPlan }>("/api/plans")).plan.id, plan.id);
  const saved = await db.mealPlan.findUniqueOrThrow({ where: { id: plan.id }, include: { preferences: true, allergies: true, exclusions: true, meals: true, shoppingList: { include: { items: true } } } });
  assert.equal(saved.userId, profile.id); assert.equal(saved.dias, 7); assert.equal(saved.personas, 2); assert.equal(saved.preferences.length, 2); assert.equal(saved.allergies.length, 1); assert.equal(saved.exclusions[0].nombre, "Brócoli");
  const list = await call<{ shoppingList: { id: string; items: MealPlan["shopping"]; store: { id: string } } }>(`/api/plans/${plan.id}/shopping-list`);
  assert.equal(list.shoppingList.id, saved.shoppingList!.id); assert.equal(list.shoppingList.store.id, store.id);
  const prices = await db.storeProduct.findMany({ where: { storeId: store.id } });
  let total = new Prisma.Decimal(0);
  for (const item of saved.shoppingList!.items) {
    const price = prices.find((p) => p.productId === item.productId)!; assert.ok(price.disponibilidad);
    assert.ok(item.precioEstimado.equals(item.cantidad.mul(price.precio).toDecimalPlaces(2))); total = total.add(item.precioEstimado);
  }
  assert.ok(total.equals(saved.costoEstimado)); assert.ok(total.lte(50));
  const item = plan.shopping[0];
  await call(`/api/shopping-items/${item.id}`, "PATCH", { purchased: true });
  assert.equal((await db.shoppingItem.findUniqueOrThrow({ where: { id: item.id } })).comprado, true);
  const reloaded = (await call<{ plan: MealPlan }>(`/api/plans/${plan.id}`)).plan; assert.equal(reloaded.shopping.find((i) => i.id === item.id)!.checked, true);
  await call(`/api/plan-meals/${plan.meals[0].id}`, "PATCH", { prepared: true });
  assert.equal((await call<{ plan: MealPlan }>(`/api/plans/${plan.id}`)).plan.meals[0].prepared, true);
  await call("/api/plans", "POST", { ...input, budget: 0 }, 400);
  await call("/api/plans", "POST", { ...input, requestKey: randomUUID(), preferenceIds: ["missing"] }, 400);
  await call("/api/plans", "POST", { ...input, requestKey: randomUUID(), storeId: "missing" }, 404);
  await call("/api/plans", "POST", { ...input, userId: "otro" }, 400);
  await call(`/api/shopping-items/${item.id}`, "PATCH", { purchased: "true" }, 400);
  await call("/api/plans/missing", "GET", undefined, 404);
  await call("/api/plans", "POST", { ...input, requestKey: randomUUID(), excludedIngredients: products.map((p) => p.nombre) }, 400);
  await call("/api/plans", "POST", { ...input, requestKey: randomUUID(), budget: 20, people: 12 }, 409);
  assert.equal(await db.mealPlan.count(), countBefore + 1, "Los errores no deben dejar planes parciales.");
  // Cambiar el perfil del DEMO no reescribe las restricciones de un plan anterior.
  const second = await call<{ plan: MealPlan }>("/api/plans", "POST", { ...input, requestKey: randomUUID(), days: 1, preferenceIds: [], allergyIds: [], excludedIngredients: [] }, 201);
  assert.deepEqual((await call<{ plan: MealPlan }>(`/api/plans/${plan.id}`)).plan.preferences, plan.preferences);
  await db.mealPlan.delete({ where: { id: second.plan.id } });
  await db.userPreference.createMany({ data: input.preferenceIds.map((preferenceId) => ({ userId: profile.id, preferenceId })), skipDuplicates: true });
  await db.userAllergy.createMany({ data: input.allergyIds.map((allergyId) => ({ userId: profile.id, allergyId })), skipDuplicates: true });
  await db.excludedIngredient.createMany({ data: [{ userId: profile.id, nombre: "Brócoli", productId: products.find((p) => p.nombre === "Brócoli")?.id }], skipDuplicates: true });
  const foreignUserId = `api_probe_${randomUUID()}`;
  try {
    const foreign = await db.user.create({ data: { id: foreignUserId, nombre: "Prueba temporal", email: `${foreignUserId}@nutriplan.example`, plans: { create: { storeId: store.id, presupuesto: 50, dias: 1, personas: 1, costoEstimado: 1,
      shoppingList: { create: { items: { create: { productId: products[0].id, cantidad: 1, unidad: products[0].unidad as "KG" | "L" | "UNIDAD", precioEstimado: 1 } } } } } } }, include: { plans: { include: { shoppingList: { include: { items: true } } } } } });
    await call(`/api/plans/${foreign.plans[0].id}`, "GET", undefined, 404);
    await call(`/api/shopping-items/${foreign.plans[0].shoppingList!.items[0].id}`, "PATCH", { purchased: true }, 404);
  } finally { await db.user.deleteMany({ where: { id: foreignUserId } }); }
  const { recipes } = await call<{ recipes: { id: string; ingredients: unknown[] }[] }>("/api/recipes"); assert.ok(recipes.length >= 12 && recipes.every((r) => r.ingredients.length > 0));
  console.log("API real verificada: catálogos, POST/GET de planes, compras y comidas persistentes, validación, repetición segura y propiedad del DEMO.");
  console.log(`Plan de comprobación guardado: ${plan.id}; PostgreSQL: ${saved.meals.length} comidas y ${saved.shoppingList!.items.length} productos.`);
}
checkApi().catch((e: unknown) => { console.error(e instanceof assert.AssertionError ? e.message : "Falló la comprobación de API. Revisa Next.js, PostgreSQL y las migraciones."); process.exitCode = 1; }).finally(() => db.$disconnect());
