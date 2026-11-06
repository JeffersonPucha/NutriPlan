import "server-only";
import { connection } from "next/server";
import { getPrisma } from "./prisma";
import type { PrismaClient } from "@/generated/prisma/client";

/** Fuerza consulta en cada petición, incluso con Cache Components activado. */
export async function databaseResponse(query: (db: PrismaClient) => Promise<unknown>) {
  await connection();
  try {
    return Response.json(await query(getPrisma()), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "DATABASE_UNAVAILABLE", message: "No se pudo consultar la base de datos." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
