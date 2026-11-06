import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { MealPlan, Recipe } from "@/lib/domain/types";

export const recipeInclude = {
  ingredients: { include: { product: true }, orderBy: { productId: "asc" } },
  preferences: { include: { preference: true }, orderBy: { preferenceId: "asc" } },
  allergies: { include: { allergy: true }, orderBy: { allergyId: "asc" } },
} satisfies Prisma.RecipeInclude;
export const planInclude = {
  store: true, preferences: { include: { preference: true }, orderBy: { preferenceId: "asc" } },
  allergies: { include: { allergy: true }, orderBy: { allergyId: "asc" } }, exclusions: { orderBy: { nombre: "asc" } },
  meals: { orderBy: [{ dia: "asc" }, { orden: "asc" }], include: { recipe: { include: recipeInclude } } },
  shoppingList: { include: { items: { orderBy: { product: { nombre: "asc" } }, include: { product: true } } } },
} satisfies Prisma.MealPlanInclude;
export type StoredPlan = Prisma.MealPlanGetPayload<{ include: typeof planInclude }>;
export function serializeRecipe(r: Prisma.RecipeGetPayload<{ include: typeof recipeInclude }>): Recipe {
  const image = r.imagen && (/^https:\/\//i.test(r.imagen) || /^\/(?!\/)/.test(r.imagen)) ? r.imagen : null;
  return { id: r.id, name: r.nombre, description: r.descripcion, time: r.tiempoPreparacion, servings: r.porciones, image,
    tags: r.preferences.map((p) => p.preference.nombre), allergens: r.allergies.map((a) => a.allergy.nombre), steps: r.instrucciones,
    ingredients: r.ingredients.map((i) => ({ productId: i.productId, name: i.product.nombre, qty: i.cantidad.toNumber(), unit: i.unidad, category: i.product.categoria })) };
}
export function serializePlan(p: StoredPlan): MealPlan {
  return { id: p.id, createdAt: p.createdAt.toISOString(), status: p.estado, store: p.store,
    preferences: { storeId: p.storeId, market: p.store.nombre, budget: p.presupuesto.toNumber(), days: p.dias, people: p.personas,
      preferenceIds: p.preferences.map((v) => v.preferenceId), goals: p.preferences.map((v) => v.preference.nombre),
      allergyIds: p.allergies.map((v) => v.allergyId), allergies: p.allergies.map((v) => v.allergy.nombre), hasNoAllergies: !p.allergies.length,
      avoidedItems: p.exclusions.map((v) => v.nombre) },
    meals: p.meals.map((m) => ({ id: m.id, day: m.dia, type: m.tipo, order: m.orden, prepared: m.preparado, cost: m.costoEstimado.toNumber(), recipe: serializeRecipe(m.recipe) })),
    shoppingListId: p.shoppingList?.id ?? null, shopping: p.shoppingList?.items.map((i) => ({ id: i.id, key: i.id, productId: i.productId, name: i.product.nombre,
      qty: i.cantidad.toNumber(), unit: i.unidad, category: i.product.categoria, cost: i.precioEstimado.toNumber(), checked: i.comprado })) ?? [], total: p.costoEstimado.toNumber() };
}
