import { databaseResponse } from "@/server/db/api";

export function GET() {
  return databaseResponse(async (db) => ({ preferences: await db.preference.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true, slug: true } }) }));
}
