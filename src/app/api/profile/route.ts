import { getPrisma } from "@/server/db/prisma";
import { currentUser } from "@/server/auth/current-user";
import { handleRoute, HttpError, json, readJson } from "@/server/http";
import { defaultPreferences, isRecord } from "@/lib/domain/preferences";
export function GET() {
  return handleRoute(async () => {
    const db = getPrisma(); const user = await currentUser(db);
    const saved = await db.user.findUniqueOrThrow({ where: { id: user.id }, include: { preferences: { include: { preference: true } }, allergies: { include: { allergy: true } }, excludedIngredients: true } });
    return json({ profile: { id: user.id, name: user.nombre, email: user.email }, preferences: { ...defaultPreferences(), preferenceIds: saved.preferences.map((p) => p.preferenceId), goals: saved.preferences.map((p) => p.preference.nombre),
      allergyIds: saved.allergies.map((a) => a.allergyId), allergies: saved.allergies.map((a) => a.allergy.nombre), hasNoAllergies: !saved.allergies.length, avoidedItems: saved.excludedIngredients.map((i) => i.nombre) } });
  });
}
export function PATCH(request: Request) {
  return handleRoute(async () => {
    const body = await readJson(request);
    if (!isRecord(body) || typeof body.name !== "string" || body.name.length > 60 || Object.keys(body).some((k) => k !== "name")) throw new HttpError(400, "INVALID_INPUT", "Introduce un nombre de hasta 60 caracteres.");
    const db = getPrisma(); const user = await currentUser(db);
    const updated = await db.user.update({ where: { id: user.id }, data: { nombre: body.name.trim() }, select: { id: true, nombre: true, email: true } });
    return json({ profile: { id: updated.id, name: updated.nombre, email: updated.email } });
  });
}
