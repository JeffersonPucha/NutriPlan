import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createDatabaseClient } from "./database-client";
import { counts } from "../prisma/seed-runner";
import { DEMO_PLAN_ID, preferenceSeed, productSeed, recipeSeed, storeSeed } from "../prisma/seed-data";
import { Prisma } from "../src/generated/prisma/client";

const prisma = createDatabaseClient();
async function checkDatabase() {
  await prisma.$queryRaw`SELECT 1`;
  const totals = await counts(prisma);
  assert.ok(totals.Store >= storeSeed.length, "Faltan supermercados del seed.");
  assert.ok(totals.Product >= productSeed.length, "Faltan productos del seed.");
  assert.ok(totals.StoreProduct >= productSeed.length * storeSeed.length, "Faltan precios por supermercado.");
  assert.ok(totals.Preference >= preferenceSeed.length && totals.Allergy >= 7, "Faltan preferencias o alergias.");
  assert.ok(totals.Recipe >= recipeSeed.length, "Faltan recetas de demostración.");

  const products = await prisma.product.findMany({ where: { id: { in: productSeed.map((p) => p.id) } }, include: { stores: { where: { storeId: { in: storeSeed.map((s) => s.id) } } } } });
  for (const product of products) {
    assert.equal(product.stores.length, 4, `Faltan precios de ${product.nombre}.`);
    assert.equal(new Set(product.stores.map((s) => s.precio.toFixed(2))).size, 4, `Los precios de ejemplo de ${product.nombre} no son diferentes.`);
  }
  const plan = await prisma.mealPlan.findUniqueOrThrow({ where: { id: DEMO_PLAN_ID }, include: {
    user: true, preferences: true, allergies: true, exclusions: true, store: true,
    meals: { include: { recipe: { include: { ingredients: { include: { product: true } }, allergies: true } } }, orderBy: [{ dia: "asc" }, { orden: "asc" }] },
    shoppingList: { include: { items: { include: { product: true } } } },
  } });
  assert.ok(plan.preferences.length > 0 && plan.allergies.length > 0 && plan.exclusions.length > 0);
  assert.equal(plan.meals.length, plan.dias); assert.ok(plan.shoppingList);
  const expected = new Map<string, Prisma.Decimal>();
  for (const meal of plan.meals) {
    assert.ok(meal.dia >= 1 && meal.dia <= plan.dias);
    assert.ok(!meal.recipe.allergies.some((a) => plan.allergies.some((u) => a.allergyId === u.allergyId)));
    for (const ingredient of meal.recipe.ingredients) {
      assert.equal(ingredient.unidad, ingredient.product.unidad);
      assert.ok(!plan.exclusions.some((i) => i.nombre.toLowerCase() === ingredient.product.nombre.toLowerCase()));
      expected.set(ingredient.productId, (expected.get(ingredient.productId) ?? new Prisma.Decimal(0)).add(ingredient.cantidad.mul(plan.personas).div(meal.recipe.porciones)));
    }
  }
  assert.equal(plan.shoppingList.items.length, expected.size);
  let total = new Prisma.Decimal(0);
  for (const item of plan.shoppingList.items) {
    assert.equal(item.unidad, item.product.unidad); assert.ok(item.cantidad.equals(expected.get(item.productId)!));
    const price = await prisma.storeProduct.findUniqueOrThrow({ where: { storeId_productId: { storeId: plan.storeId, productId: item.productId } } });
    assert.ok(item.precioEstimado.equals(item.cantidad.mul(price.precio).toDecimalPlaces(2)));
    total = total.add(item.precioEstimado);
  }
  assert.ok(plan.costoEstimado.equals(total)); assert.ok(total.lte(plan.presupuesto));

  // Cada prueba inválida es una transacción que PostgreSQL revierte por completo.
  const existing = await prisma.userPreference.findFirstOrThrow();
  await assert.rejects(prisma.$transaction((db) => db.userPreference.create({ data: { userId: existing.userId, preferenceId: existing.preferenceId } })), (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002");
  await assert.rejects(prisma.$transaction((db) => db.recipeIngredient.create({ data: { recipeId: recipeSeed[0].id, productId: `missing_${randomUUID()}`, cantidad: 1, unidad: "KG" } })), (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003");
  await assert.rejects(prisma.$transaction((db) => db.storeProduct.update({ where: { storeId_productId: { storeId: storeSeed[0].id, productId: productSeed[0].id } }, data: { precio: -1 } })));
  const after = await counts(prisma); assert.deepEqual(after, totals, "Una comprobación no debe dejar registros de prueba.");
  console.log("PostgreSQL conectado. Relaciones, unidades, totales, unicidad, claves foráneas y precios no negativos: correctos.");
  console.table(totals);
}

checkDatabase().catch((error: unknown) => {
  console.error(error instanceof assert.AssertionError ? error.message : "La comprobación de PostgreSQL falló. Revisa la conexión, el esquema y el seed.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
