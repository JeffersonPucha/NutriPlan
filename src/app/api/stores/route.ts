import { databaseResponse } from "@/server/db/api";

export function GET() {
  return databaseResponse(async (db) => ({ stores: await db.store.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true, slug: true, activo: true } }) }));
}
