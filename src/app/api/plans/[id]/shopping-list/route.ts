import { getPrisma } from "@/server/db/prisma";
import { findPlan } from "@/server/plans/repository";
import { handleRoute, HttpError, json } from "@/server/http";
export function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const plan = await findPlan(getPrisma(), (await params).id);
    if (!plan?.shoppingListId) throw new HttpError(404, "LIST_NOT_FOUND", "Esta planificación no tiene una lista de compras.");
    return json({ shoppingList: { id: plan.shoppingListId, planId: plan.id, store: plan.store, items: plan.shopping, total: plan.total } });
  });
}
