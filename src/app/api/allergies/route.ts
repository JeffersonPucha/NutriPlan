import { databaseResponse } from "@/server/db/api";

export function GET() {
  return databaseResponse(async (db) => ({ allergies: await db.allergy.findMany({ orderBy: { nombre: "asc" }, select: { id: true, nombre: true, slug: true } }) }));
}
