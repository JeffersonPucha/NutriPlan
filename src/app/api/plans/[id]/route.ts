import { getPrisma } from "@/server/db/prisma";
import { findPlan } from "@/server/plans/repository";
import { handleRoute, json } from "@/server/http";
export function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => json({ plan: await findPlan(getPrisma(), (await params).id) }));
}
