import { getPrisma } from "@/server/db/prisma";
import { currentUser } from "@/server/auth/current-user";
import { handleRoute, HttpError, json, readJson } from "@/server/http";
import { parseBooleanPatch } from "@/lib/domain/validation";
export function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const raw = await readJson(request); let purchased;
    try { purchased = parseBooleanPatch(raw, "purchased"); } catch (e) { throw new HttpError(400, "INVALID_INPUT", (e as Error).message); }
    const db = getPrisma(); const user = await currentUser(db); const { id } = await params;
    const item = await db.shoppingItem.findFirst({ where: { id, shoppingList: { plan: { userId: user.id } } }, select: { id: true } });
    if (!item) throw new HttpError(404, "ITEM_NOT_FOUND", "No se encontró el producto de esa lista.");
    const updated = await db.shoppingItem.update({ where: { id }, data: { comprado: purchased }, select: { id: true, comprado: true } });
    return json({ item: { id: updated.id, purchased: updated.comprado } });
  });
}
