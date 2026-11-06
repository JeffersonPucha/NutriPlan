import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export function createDatabaseClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Falta configurar DATABASE_URL.");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, connectionTimeoutMillis: 5000, max: 5 }) });
}
