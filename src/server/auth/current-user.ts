import "server-only";
import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import { HttpError } from "@/server/http";

// Único punto que deberá sustituirse por la sesión cuando se incorpore autenticación.
export async function currentUser(db: PrismaClient | Prisma.TransactionClient) {
  const id = process.env.NUTRIPLAN_DEMO_USER_ID || "demo_nutriplan_user";
  const user = await db.user.findUnique({ where: { id }, select: { id: true, nombre: true, email: true } });
  if (!user) throw new HttpError(503, "DEMO_USER_UNAVAILABLE", "No está disponible el perfil de desarrollo. Ejecuta el seed o revisa su configuración.");
  return user;
}
