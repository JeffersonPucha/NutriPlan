import "server-only";
import type { MealPlan } from "@/lib/domain/types";

/** La implementación futura deberá validar la sesión y la propiedad de cada plan. */
export interface PlanRepository {
  findCurrentForUser(userId: string): Promise<MealPlan | null>;
  saveForUser(userId: string, plan: MealPlan): Promise<void>;
}
