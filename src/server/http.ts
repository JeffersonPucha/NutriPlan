import "server-only";
import { connection } from "next/server";
import { Prisma } from "@/generated/prisma/client";
export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: Record<string, unknown>) { super(message); }
}
export function json(data: unknown, status = 200) { return Response.json(data, { status, headers: { "Cache-Control": "no-store" } }); }
export async function readJson(request: Request): Promise<unknown> {
  try { const text = await request.text(); if (text.length > 20000) throw new Error(); return JSON.parse(text); }
  catch { throw new HttpError(400, "INVALID_JSON", "Envía un documento JSON válido de tamaño permitido."); }
}
export async function handleRoute(action: () => Promise<Response>) {
  await connection();
  try { return await action(); }
  catch (error) {
    if (error instanceof HttpError) return json({ code: error.code, message: error.message, ...error.details }, error.status);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return json({ code: "NOT_FOUND", message: "No se encontró el registro solicitado." }, 404);
    return json({ code: "SERVER_ERROR", message: "No pudimos completar la operación. Vuelve a intentarlo." }, 500);
  }
}
