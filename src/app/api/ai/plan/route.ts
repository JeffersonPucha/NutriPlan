import { AI_NOT_ENABLED } from "@/server/openai/plan-generator";

export function POST() { return Response.json(AI_NOT_ENABLED, { status: 501 }); }
