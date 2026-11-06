import { Prisma, type PrismaClient } from "../src/generated/prisma/client";
import { allergyId, allergySeed, canonicalPreference, DEMO_LIST_ID, DEMO_PLAN_ID, DEMO_USER_ID,
  demoRecipeIds, ingredientQuantity, preferenceId, preferenceSeed, productId, productSeed, recipeSeed, slug, storePriceCents, storeSeed } from "./seed-data";

export async function seedDevelopment(prisma: PrismaClient) {
  // Un fallo revierte todo el seed. Upsert/createMany evitan duplicados al repetirlo.
  const db = prisma;
    const before = await counts(db);
    for (const store of storeSeed) {
      const data = { id: store.id, nombre: store.nombre, slug: store.slug };
      await db.store.upsert({ where: { id: store.id }, create: data, update: { nombre: data.nombre, slug: data.slug } });
    }
    for (const nombre of preferenceSeed) {
      await db.preference.upsert({ where: { id: preferenceId(nombre) }, create: { id: preferenceId(nombre), nombre, slug: slug(nombre) }, update: { nombre, slug: slug(nombre) } });
    }
    for (const nombre of allergySeed) {
      await db.allergy.upsert({ where: { id: allergyId(nombre) }, create: { id: allergyId(nombre), nombre, slug: slug(nombre) }, update: { nombre, slug: slug(nombre) } });
    }
    for (const product of productSeed) {
      const data = { id: product.id, nombre: product.nombre, categoria: product.categoria, unidad: product.unidad };
      await db.product.upsert({ where: { id: product.id }, create: data, update: { nombre: data.nombre, categoria: data.categoria, unidad: data.unidad } });
      for (const store of storeSeed) {
        const precio = new Prisma.Decimal(storePriceCents(product, store)).div(100);
        await db.storeProduct.upsert({ where: { storeId_productId: { storeId: store.id, productId: product.id } },
          create: { storeId: store.id, productId: product.id, precio }, update: { precio } });
      }
    }
    for (const recipe of recipeSeed) {
      const costoEstimado = recipe.ingredients.reduce((sum, i) => sum.add(new Prisma.Decimal(ingredientQuantity(i.qty, i.unit)).mul(productSeed.find((p) => p.id === productId(i.name))!.precioBase)), new Prisma.Decimal(0)).toDecimalPlaces(2);
      const data = { nombre: recipe.name, descripcion: "Receta de demostración del catálogo de NutriPlan.", tiempoPreparacion: recipe.time,
        instrucciones: recipe.steps, porciones: 1, costoEstimado };
      await db.recipe.upsert({ where: { id: recipe.id }, create: { id: recipe.id, ...data }, update: data });
      for (const ingredient of recipe.ingredients) {
        const product = productSeed.find((p) => p.id === productId(ingredient.name))!;
        const data = { cantidad: new Prisma.Decimal(ingredientQuantity(ingredient.qty, ingredient.unit)), unidad: product.unidad };
        await db.recipeIngredient.upsert({ where: { recipeId_productId: { recipeId: recipe.id, productId: product.id } },
          create: { recipeId: recipe.id, productId: product.id, ...data }, update: data });
      }
      await db.recipePreference.createMany({ data: recipe.tags.map((tag) => ({ recipeId: recipe.id, preferenceId: preferenceId(canonicalPreference(tag)) })), skipDuplicates: true });
      await db.recipeAllergy.createMany({ data: recipe.allergens.map((name) => ({ recipeId: recipe.id, allergyId: allergyId(name) })), skipDuplicates: true });
    }
    const user = await db.user.upsert({ where: { email: "demo@nutriplan.example" }, create: { id: DEMO_USER_ID, nombre: "Perfil de desarrollo", email: "demo@nutriplan.example" }, update: {} });
    await db.userPreference.createMany({ data: ["Saludable", "Equilibrado"].map((name) => ({ userId: user.id, preferenceId: preferenceId(name) })), skipDuplicates: true });
    await db.userAllergy.upsert({ where: { userId_allergyId: { userId: user.id, allergyId: allergyId("Gluten") } }, create: { userId: user.id, allergyId: allergyId("Gluten") }, update: {} });
    await db.excludedIngredient.upsert({ where: { userId_nombre: { userId: user.id, nombre: "Brócoli" } }, create: { userId: user.id, nombre: "Brócoli", productId: productId("Brócoli") }, update: {} });

    // La lista de ejemplo usa unidades base y el precio del supermercado elegido.
    const amounts = new Map<string, Prisma.Decimal>();
    for (const id of demoRecipeIds) for (const ingredient of recipeSeed.find((r) => r.id === id)!.ingredients) {
      const key = productId(ingredient.name);
      amounts.set(key, (amounts.get(key) ?? new Prisma.Decimal(0)).add(new Prisma.Decimal(ingredientQuantity(ingredient.qty, ingredient.unit)).mul(2)));
    }
    const shopping = [...amounts].map(([id, cantidad]) => {
      const product = productSeed.find((p) => p.id === id)!;
      const price = new Prisma.Decimal(storePriceCents(product, storeSeed[0])).div(100);
      return { productId: id, cantidad, unidad: product.unidad, precioEstimado: cantidad.mul(price).toDecimalPlaces(2) };
    });
    const total = shopping.reduce((sum, item) => sum.add(item.precioEstimado), new Prisma.Decimal(0));
    await db.mealPlan.upsert({ where: { id: DEMO_PLAN_ID }, create: { id: DEMO_PLAN_ID, userId: user.id, storeId: storeSeed[0].id, presupuesto: 50, dias: 3, personas: 2, estado: "ACTIVO", costoEstimado: total,
      preferences: { create: ["Saludable", "Equilibrado"].map((name) => ({ preferenceId: preferenceId(name) })) },
      allergies: { create: [{ allergyId: allergyId("Gluten") }] }, exclusions: { create: [{ nombre: "Brócoli" }] } }, update: {} });
    const mealCosts = demoRecipeIds.map((id) => recipeSeed.find((r) => r.id === id)!.ingredients.reduce((sum, i) => {
      const product = productSeed.find((p) => p.id === productId(i.name))!;
      return sum.add(new Prisma.Decimal(ingredientQuantity(i.qty, i.unit)).mul(2).mul(new Prisma.Decimal(storePriceCents(product, storeSeed[0])).div(100)));
    }, new Prisma.Decimal(0)).toDecimalPlaces(2));
    mealCosts[mealCosts.length - 1] = mealCosts[mealCosts.length - 1].add(total.sub(mealCosts.reduce((sum, v) => sum.add(v), new Prisma.Decimal(0))));
    for (const [index, recipeId] of demoRecipeIds.entries()) await db.planMeal.upsert({ where: { id: `demo_meal_${index + 1}` },
      create: { id: `demo_meal_${index + 1}`, planId: DEMO_PLAN_ID, recipeId, dia: index + 1, tipo: "ALMUERZO", orden: 0, costoEstimado: mealCosts[index] }, update: {} });
    await db.shoppingList.upsert({ where: { planId: DEMO_PLAN_ID }, create: { id: DEMO_LIST_ID, planId: DEMO_PLAN_ID }, update: {} });
    const list = await db.shoppingList.findUniqueOrThrow({ where: { planId: DEMO_PLAN_ID } });
    for (const item of shopping) await db.shoppingItem.upsert({ where: { shoppingListId_productId: { shoppingListId: list.id, productId: item.productId } },
      create: { shoppingListId: list.id, ...item }, update: {} });
const after = await counts(db);
  return { added: Object.fromEntries(Object.entries(after).map(([key, value]) => [key, value - before[key as keyof typeof before]])), totals: after };
}

export async function counts(db: PrismaClient | Prisma.TransactionClient) {
  return { PlanPreference: await db.planPreference.count(), PlanAllergy: await db.planAllergy.count(), PlanExcludedIngredient: await db.planExcludedIngredient.count(), User: await db.user.count(), Preference: await db.preference.count(), Allergy: await db.allergy.count(),
    UserPreference: await db.userPreference.count(), UserAllergy: await db.userAllergy.count(), ExcludedIngredient: await db.excludedIngredient.count(),
    Store: await db.store.count(), Product: await db.product.count(), StoreProduct: await db.storeProduct.count(), MealPlan: await db.mealPlan.count(),
    PlanMeal: await db.planMeal.count(), Recipe: await db.recipe.count(), RecipeIngredient: await db.recipeIngredient.count(),
    RecipePreference: await db.recipePreference.count(), RecipeAllergy: await db.recipeAllergy.count(), ShoppingList: await db.shoppingList.count(), ShoppingItem: await db.shoppingItem.count() };
}

