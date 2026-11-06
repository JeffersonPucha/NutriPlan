import type { Preferences } from "./types";
export function defaultPreferences(): Preferences {
  return { storeId: null, market: null, budget: 50, days: 7, people: 2, preferenceIds: [], allergyIds: [], goals: [], allergies: [], avoidedItems: [], hasNoAllergies: true };
}
export function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
export function toggleValue(values: string[], value: string) { return values.includes(value) ? values.filter((s) => s !== value) : [...values, value]; }
