import "server-only";
import type { MealPlan, Preferences } from "@/lib/domain/types";

/** Contrato para una integración posterior. No hay SDK ni llamadas a OpenAI en esta fase. */
export interface ServerPlanGenerator {
  generate(preferences: Preferences): Promise<MealPlan>;
}

export const AI_NOT_ENABLED = { code: "AI_NOT_ENABLED", message: "La generación con IA estará disponible en una próxima etapa. El plan actual utiliza el catálogo local." } as const;
