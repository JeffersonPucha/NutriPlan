import { connection } from "next/server";
import { getPrisma } from "@/server/db/prisma";

export async function GET() {
  await connection();
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", database: "connected" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ status: "error", database: "disconnected" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
