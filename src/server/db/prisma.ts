import "server-only";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getServerEnvironment } from "@/server/env";

const globalForPrisma = globalThis as unknown as { nutriplanPrisma?: PrismaClient };
let client = globalForPrisma.nutriplanPrisma;

/** Cliente compartido y diferido para los Route Handlers; nunca se importa desde React cliente. */
export function getPrisma() {
  if (client) return client;
  const { databaseUrl } = getServerEnvironment();
  if (!databaseUrl) throw new Error("Configura DATABASE_URL antes de activar la persistencia del servidor.");
  client = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl, connectionTimeoutMillis: 5000, max: 10 }) });
  if (process.env.NODE_ENV !== "production") globalForPrisma.nutriplanPrisma = client;
  return client;
}
