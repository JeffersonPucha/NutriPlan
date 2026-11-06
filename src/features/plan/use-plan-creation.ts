"use client";
import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { parsePlanInput } from "@/lib/domain/validation";
import type { MealPlan, PlanStrategy, Preferences } from "@/lib/domain/types";
import { planActions } from "./plan-store";
export function usePlanCreation(onSuccess: () => void) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [budgetIssue, setBudgetIssue] = useState<{ preferences: Preferences; estimate: number } | null>(null);
  const request = useRef<{ payload: string; key: string } | null>(null);
  const inFlight = useRef(false);
  async function submit(preferences: Preferences, strategy: PlanStrategy = "standard") {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const input = parsePlanInput({ storeId: preferences.storeId, budget: preferences.budget, days: preferences.days, people: preferences.people,
        preferenceIds: preferences.preferenceIds, allergyIds: preferences.hasNoAllergies ? [] : preferences.allergyIds, excludedIngredients: preferences.avoidedItems, strategy });
      const payload = JSON.stringify(input);
      if (request.current?.payload !== payload) request.current = { payload, key: crypto.randomUUID() };
      const result = await api<{ plan: MealPlan }>("/api/plans", { method: "POST", body: JSON.stringify({ ...input, requestKey: request.current!.key }) });
      planActions.acceptPlan(result.plan); setBudgetIssue(null); request.current = null; onSuccess();
    } catch (e) {
      if (e instanceof ApiError && e.code === "BUDGET_EXCEEDED" && typeof e.details.estimatedCost === "number") setBudgetIssue({ preferences, estimate: e.details.estimatedCost });
      else setError(e instanceof Error ? e.message : "No pudimos crear la planificación.");
    } finally { inFlight.current = false; setBusy(false); }
  }
  return { submit, busy, error, budgetIssue, clearBudgetIssue: () => setBudgetIssue(null) };
}
