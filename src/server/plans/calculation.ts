import { Prisma } from "@/generated/prisma/client";
import { normalize } from "@/lib/domain/validation";
import type { PlanInput } from "@/lib/domain/types";

export interface PricedIngredient { productId: string; name: string; category: string; unit: "KG" | "L" | "UNIDAD"; quantity: Prisma.Decimal; price: Prisma.Decimal }
export interface PricedRecipe { id: string; name: string; servings: number; preferenceIds: string[]; allergyIds: string[]; ingredients: PricedIngredient[] }
export interface Calculation {
  days: number; total: Prisma.Decimal;
  meals: { recipeId: string; day: number; cost: Prisma.Decimal }[];
  shopping: { productId: string; quantity: Prisma.Decimal; unit: "KG" | "L" | "UNIDAD"; cost: Prisma.Decimal }[];
}
export function compatible(recipe: PricedRecipe, input: PlanInput) {
  const text = normalize([recipe.name, ...recipe.ingredients.map((i) => i.name)].join(" "));
  return recipe.ingredients.length > 0 && !recipe.allergyIds.some((id) => input.allergyIds.includes(id)) && !input.excludedIngredients.map(normalize).some((term) => text.includes(term));
}
function scaled(recipe: PricedRecipe, people: number) { return recipe.ingredients.map((i) => ({ ...i, quantity: i.quantity.mul(people).div(recipe.servings).toDecimalPlaces(3) })); }
function cost(recipe: PricedRecipe, people: number) { return scaled(recipe, people).reduce((sum, i) => sum.add(i.quantity.mul(i.price)), new Prisma.Decimal(0)); }
export function calculatePlan(catalog: PricedRecipe[], input: PlanInput, cheapest = false, days = input.days): Calculation | null {
  const score = (r: PricedRecipe) => input.preferenceIds.filter((id) => r.preferenceIds.includes(id)).length;
  const candidates = catalog.filter((r) => compatible(r, input)).sort((a, b) => cheapest ? cost(a, input.people).comparedTo(cost(b, input.people)) || score(b) - score(a) || a.id.localeCompare(b.id) : score(b) - score(a) || cost(a, input.people).comparedTo(cost(b, input.people)) || a.id.localeCompare(b.id));
  if (!candidates.length) return null;
  const pool = cheapest ? candidates.slice(0, 5) : candidates;
  const shopping = new Map<string, { productId: string; quantity: Prisma.Decimal; unit: "KG" | "L" | "UNIDAD"; price: Prisma.Decimal }>();
  const meals = Array.from({ length: days }, (_, index) => {
    const recipe = pool[index % pool.length];
    for (const i of scaled(recipe, input.people)) {
      const previous = shopping.get(i.productId);
      shopping.set(i.productId, { productId: i.productId, quantity: (previous?.quantity ?? new Prisma.Decimal(0)).add(i.quantity), unit: i.unit, price: i.price });
    }
    return { recipeId: recipe.id, day: index + 1, cost: cost(recipe, input.people).toDecimalPlaces(2) };
  });
  const items = [...shopping.values()].map((i) => ({ productId: i.productId, quantity: i.quantity, unit: i.unit, cost: i.quantity.mul(i.price).toDecimalPlaces(2) }));
  const total = items.reduce((sum, i) => sum.add(i.cost), new Prisma.Decimal(0));
  // Distribuye la diferencia de redondeo; las comidas suman el mismo total que la canasta.
  const mealTotal = meals.reduce((sum, m) => sum.add(m.cost), new Prisma.Decimal(0));
  let difference = total.sub(mealTotal);
  for (let i = meals.length - 1; i >= 0 && !difference.isZero(); i--) {
    const adjustment = difference.isNegative() ? Prisma.Decimal.max(difference, meals[i].cost.neg()) : difference;
    meals[i].cost = meals[i].cost.add(adjustment); difference = difference.sub(adjustment);
  }
  return { days, total, meals, shopping: items };
}
