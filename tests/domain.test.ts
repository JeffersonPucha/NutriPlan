import assert from "node:assert/strict";
import { test } from "node:test";
import { Prisma } from "../src/generated/prisma/client";
import { parsePlanInput, parseBooleanPatch, normalize } from "../src/lib/domain/validation";
import { calculatePlan, compatible, type PricedRecipe } from "../src/server/plans/calculation";
const input = () => parsePlanInput({ storeId: "store_test", budget: 50, days: 3, people: 2, preferenceIds: [], allergyIds: [], excludedIngredients: [] });
const recipe = (patch: Partial<PricedRecipe> = {}): PricedRecipe => ({ id: "recipe_test", name: "Arroz y verduras", servings: 1, preferenceIds: [], allergyIds: [],
  ingredients: [{ productId: "rice", name: "Arroz", category: "Despensa", unit: "KG", quantity: new Prisma.Decimal("0.125"), price: new Prisma.Decimal("2.33") }], ...patch });

test("valida límites, identificadores y cuerpos antes de acceder a PostgreSQL", () => {
  for (const patch of [{ storeId: null }, { budget: 19 }, { budget: 50.123 }, { budget: NaN }, { days: 8 }, { days: 1.5 }, { people: 0 }, { preferenceIds: [""] }, { allergyIds: "gluten" }, { userId: "otro" }, { total: 0 }]) assert.throws(() => parsePlanInput({ ...input(), ...patch }));
  assert.equal(input().strategy, "standard");
});
test("normaliza exclusiones sin depender de tildes, espacios o mayúsculas", () => {
  const parsed = parsePlanInput({ ...input(), excludedIngredients: [" Brócoli ", "BROCOLI"] }); assert.deepEqual(parsed.excludedIngredients, ["Brócoli"]);
  assert.equal(normalize("BrÓcOli"), "brocoli"); assert.throws(() => parsePlanInput({ ...input(), excludedIngredients: ["!!!"] }));
});
test("acepta únicamente booleanos para marcar una compra o comida", () => {
  assert.equal(parseBooleanPatch({ purchased: true }, "purchased"), true);
  for (const value of [{ purchased: "true" }, {}, { purchased: true, userId: "otro" }]) assert.throws(() => parseBooleanPatch(value, "purchased"));
});
test("agrupa productos y usa precios proporcionados por el repositorio", () => {
  const plan = calculatePlan([recipe()], input())!;
  assert.equal(plan.shopping.length, 1); assert.equal(plan.shopping[0].quantity.toString(), "0.75"); assert.equal(plan.total.toFixed(2), "1.75");
  assert.equal(plan.meals.reduce((sum, m) => sum.add(m.cost), new Prisma.Decimal(0)).toFixed(2), "1.75");
  const otherStore = recipe({ ingredients: [{ ...recipe().ingredients[0], price: new Prisma.Decimal("4.00") }] });
  assert.equal(calculatePlan([otherStore], input())!.total.toFixed(2), "3.00");
});
test("adapta cantidades al número real de porciones de la receta", () => {
  const plan = calculatePlan([recipe({ servings: 2 })], input())!; assert.equal(plan.shopping[0].quantity.toString(), "0.375");
});
test("excluye alérgenos y productos evitados sin ignorar restricciones", () => {
  assert.equal(compatible(recipe({ allergyIds: ["lactosa"] }), { ...input(), allergyIds: ["lactosa"] }), false);
  assert.equal(compatible(recipe({ name: "Arroz con brócoli" }), { ...input(), excludedIngredients: ["BROCOLI"] }), false);
  assert.equal(calculatePlan([recipe({ allergyIds: ["lactosa"] })], { ...input(), allergyIds: ["lactosa"] }), null);
});
test("prioriza las preferencias reales y mantiene variedad al optimizar", () => {
  const a = recipe({ id: "a" }); const b = recipe({ id: "b", preferenceIds: ["protein"] });
  assert.equal(calculatePlan([a, b], { ...input(), preferenceIds: ["protein"] })!.meals[0].recipeId, "b");
  assert.equal(new Set(calculatePlan([a, b], input(), true)!.meals.map((m) => m.recipeId)).size, 2);
});
test("genera días numerados desde uno y un cálculo independiente de la entrada", () => {
  const source = input(); const plan = calculatePlan([recipe()], source, true, 1)!;
  assert.equal(plan.days, 1); assert.equal(plan.meals[0].day, 1); assert.equal(source.days, 3);
});
test("rechaza claves de repetición inválidas y valida las de UUID v4", () => {
  assert.throws(() => parsePlanInput({ ...input(), requestKey: "no-valida" }));
  const key = "009c0717-99f8-4cb8-a357-e58362df3e22"; assert.equal(parsePlanInput({ ...input(), requestKey: key }).requestKey, key);
});
