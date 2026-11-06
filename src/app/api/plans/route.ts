import { getPrisma } from "@/server/db/prisma";
import { createPlan, findPlan } from "@/server/plans/repository";
import { handleRoute, HttpError, json, readJson } from "@/server/http";
import { parsePlanInput } from "@/lib/domain/validation";
export function GET() { return handleRoute(async () => json({ plan: await findPlan(getPrisma()) })); }
export function POST(request: Request) {
  return handleRoute(async () => {
    const raw = await readJson(request);
    let input;
    try { input = parsePlanInput(raw); } catch (e) { throw new HttpError(400, "INVALID_INPUT", e instanceof Error ? e.message : "Revisa los datos del plan."); }
    const result = await createPlan(getPrisma(), input);
    return json({ plan: result.plan }, result.created ? 201 : 200);
  });
}
