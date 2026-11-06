import assert from "node:assert/strict";
import { test } from "node:test";
import { allergyId, allergySeed, canonicalProduct, demoRecipeIds, ingredientQuantity, preferenceId, preferenceSeed, productId, productSeed, recipeSeed, storePriceCents, storeSeed } from "../prisma/seed-data";

test("el seed tiene cuatro supermercados y productos con identidad única", () => {
  assert.equal(storeSeed.length, 4); assert.equal(new Set(storeSeed.map((s) => s.slug)).size, 4);
  assert.equal(productSeed.length, 30); assert.equal(new Set(productSeed.map((p) => p.id)).size, 30);
  for (const name of ["Arroz", "Pollo", "Huevos", "Tomate", "Cebolla", "Brócoli", "Leche", "Queso", "Avena", "Pasta", "Lentejas", "Atún", "Aguacate", "Papa", "Zanahoria"]) assert.ok(productSeed.some((p) => p.nombre === name));
});

test("todos los productos tienen cuatro precios positivos y diferentes", () => {
  for (const product of productSeed) {
    const prices = storeSeed.map((store) => storePriceCents(product, store));
    assert.ok(prices.every((price) => price > 0)); assert.equal(new Set(prices).size, 4, product.nombre);
  }
});

test("recetas, preferencias y alergias apuntan a entidades existentes", () => {
  assert.equal(recipeSeed.length, 12); assert.equal(preferenceSeed.length, 11); assert.equal(allergySeed.length, 7);
  const products = new Set(productSeed.map((p) => p.id)); const preferences = new Set(preferenceSeed.map(preferenceId)); const allergies = new Set(allergySeed.map(allergyId));
  for (const recipe of recipeSeed) {
    assert.ok(recipe.ingredients.every((i) => products.has(productId(i.name)) && ingredientQuantity(i.qty, i.unit) > 0));
    assert.ok(recipe.tags.every((tag) => preferences.has(preferenceId(tag))));
    assert.ok(recipe.allergens.every((name) => allergies.has(allergyId(name))));
  }
});

test("las cantidades usan unidades base compatibles con los precios", () => {
  assert.equal(ingredientQuantity(180, "g"), .18); assert.equal(ingredientQuantity(.5, "unid"), .5);
  assert.equal(canonicalProduct("Pechuga de pollo"), "Pollo"); assert.equal(canonicalProduct("Huevo"), "Huevos");
  for (const recipe of recipeSeed) for (const ingredient of recipe.ingredients) assert.equal(productSeed.find((p) => p.id === productId(ingredient.name))?.unidad, ingredient.unit === "g" ? "KG" : "UNIDAD");
});

test("el plan de desarrollo respeta el gluten y el brócoli excluidos", () => {
  for (const id of demoRecipeIds) {
    const recipe = recipeSeed.find((r) => r.id === id); assert.ok(recipe);
    assert.ok(!recipe.allergens.includes("Gluten")); assert.ok(recipe.ingredients.every((i) => i.name !== "Brócoli"));
  }
});
