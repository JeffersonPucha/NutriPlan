import { getPrisma } from "@/server/db/prisma";
import { currentUser } from "@/server/auth/current-user";
import { handleRoute, HttpError, json, readJson } from "@/server/http";
import { parseBooleanPatch } from "@/lib/domain/validation";
export function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const raw = await readJson(request); let prepared;
    try { prepared = parseBooleanPatch(raw, "prepared"); } catch (e) { throw new HttpError(400, "INVALID_INPUT", (e as Error).message); }
    const db = getPrisma(); const user = await currentUser(db); const { id } = await params;
    const item = await db.planMeal.findFirst({ where: { id, plan: { userId: user.id } }, select: { id: true } });
    if (!item) throw new HttpError(404, "MEAL_NOT_FOUND", "No se encontró esa comida.");
    const updated = await db.planMeal.update({ where: { id }, data: { preparado: prepared }, select: { id: true, preparado: true } });
    return json({ meal: { id: updated.id, prepared: updated.preparado } });
  });
}
