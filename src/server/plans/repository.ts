import "server-only";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { currentUser } from "@/server/auth/current-user";
import { HttpError } from "@/server/http";
import { normalize } from "@/lib/domain/validation";
import type { PlanInput } from "@/lib/domain/types";
import { calculatePlan, type PricedRecipe } from "./calculation";
import { planInclude, serializePlan } from "./serialization";

export async function findPlan(db: PrismaClient, id?: string) {
  const user = await currentUser(db);
  const plan = id ? await db.mealPlan.findFirst({ where: { id, userId: user.id }, include: planInclude })
    : await db.mealPlan.findFirst({ where: { userId: user.id, estado: { not: "ARCHIVADO" } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], include: planInclude });
  if (id && !plan) throw new HttpError(404, "PLAN_NOT_FOUND", "No se encontró esa planificación.");
  return plan ? serializePlan(plan) : null;
}
export async function createPlan(db: PrismaClient, input: PlanInput) {
  const user = await currentUser(db);
  if (input.requestKey) {
    const existing = await db.mealPlan.findUnique({ where: { requestKey: input.requestKey }, include: planInclude });
    if (existing && existing.userId === user.id) return { plan: serializePlan(existing), created: false };
    if (existing) throw new HttpError(409, "REQUEST_CONFLICT", "La solicitud ya fue utilizada.");
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        // Una transacción utiliza una conexión; sus consultas deben ejecutarse en orden.
        const store = await tx.store.findFirst({ where: { id: input.storeId, activo: true } });
        const preferences = await tx.preference.findMany({ where: { id: { in: input.preferenceIds } } });
        const allergies = await tx.allergy.findMany({ where: { id: { in: input.allergyIds } } });
        const recipes = await tx.recipe.findMany({ orderBy: { id: "asc" }, include: {
          preferences: true, allergies: true, ingredients: { include: { product: { include: { stores: { where: { storeId: input.storeId, disponibilidad: true } } } } } },
        } });
        if (!store) throw new HttpError(404, "STORE_NOT_FOUND", "Ese supermercado no está disponible.");
        if (preferences.length !== input.preferenceIds.length || allergies.length !== input.allergyIds.length) throw new HttpError(400, "INVALID_CATALOG_IDS", "Una preferencia o alergia seleccionada ya no existe.");
        const catalog: PricedRecipe[] = recipes.filter((r) => r.ingredients.every((i) => i.product.activo && i.unidad === i.product.unidad && i.product.stores.length > 0)).map((r) => ({
          id: r.id, name: r.nombre, servings: r.porciones, preferenceIds: r.preferences.map((p) => p.preferenceId), allergyIds: r.allergies.map((a) => a.allergyId),
          ingredients: r.ingredients.map((i) => ({ productId: i.productId, name: i.product.nombre, category: i.product.categoria, unit: i.unidad, quantity: i.cantidad, price: i.product.stores[0].precio })),
        }));
        let calculation = calculatePlan(catalog, input, input.strategy !== "standard");
        if (!calculation) throw new HttpError(400, "NO_COMPATIBLE_RECIPES", "No hay recetas con productos disponibles que cumplan todas tus restricciones. Revisa los ingredientes excluidos o las alergias.");
        if (input.strategy === "reduce-days") {
          for (let days = input.days - 1; days >= 1; days--) {
            const candidate = calculatePlan(catalog, input, true, days)!;
            if (candidate.total.lte(input.budget)) { calculation = candidate; break; }
          }
        }
        if (calculation.total.gt(input.budget)) throw new HttpError(409, "BUDGET_EXCEEDED", "La canasta supera el presupuesto. Puedes optimizar, reducir días o editar el límite.", { estimatedCost: calculation.total.toNumber(), budget: input.budget });
        // El perfil guarda la selección actual; cada plan conserva además su propia copia relacional.
        await tx.userPreference.deleteMany({ where: { userId: user.id } });
        await tx.userAllergy.deleteMany({ where: { userId: user.id } });
        await tx.excludedIngredient.deleteMany({ where: { userId: user.id } });
        await tx.userPreference.createMany({ data: input.preferenceIds.map((preferenceId) => ({ userId: user.id, preferenceId })) });
        await tx.userAllergy.createMany({ data: input.allergyIds.map((allergyId) => ({ userId: user.id, allergyId })) });
        const products = await tx.product.findMany({ where: { activo: true }, select: { id: true, nombre: true } });
        await tx.excludedIngredient.createMany({ data: input.excludedIngredients.map((nombre) => ({ userId: user.id, nombre, productId: products.find((p) => normalize(p.nombre) === normalize(nombre))?.id })) });
        const plan = await tx.mealPlan.create({ data: {
          userId: user.id, storeId: store.id, presupuesto: input.budget, dias: calculation.days, personas: input.people, estado: "ACTIVO", costoEstimado: calculation.total, requestKey: input.requestKey,
          preferences: { create: input.preferenceIds.map((preferenceId) => ({ preferenceId })) }, allergies: { create: input.allergyIds.map((allergyId) => ({ allergyId })) },
          exclusions: { create: input.excludedIngredients.map((nombre) => ({ nombre })) },
          meals: { create: calculation.meals.map((m) => ({ recipeId: m.recipeId, dia: m.day, tipo: "ALMUERZO", orden: 0, costoEstimado: m.cost })) },
          shoppingList: { create: { items: { create: calculation.shopping.map((i) => ({ productId: i.productId, cantidad: i.quantity, unidad: i.unit, precioEstimado: i.cost })) } } },
        }, include: planInclude });
        return { plan: serializePlan(plan), created: true };
      }, { isolationLevel: "Serializable", timeout: 20000 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && input.requestKey) {
        const existing = await db.mealPlan.findFirst({ where: { requestKey: input.requestKey, userId: user.id }, include: planInclude });
        if (existing) return { plan: serializePlan(existing), created: false };
      }
      throw error;
    }
  }
  throw new HttpError(409, "RETRY_REQUEST", "Hay otra operación en curso. Vuelve a intentarlo.");
}
