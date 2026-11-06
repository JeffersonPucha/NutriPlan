import { isRecord } from "./preferences";
import type { PlanInput } from "./types";
export function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
function list(value: unknown, label: string, maxLength = 128): string[] {
  if (!Array.isArray(value) || value.length > 50 || value.some((s) => typeof s !== "string" || !s.trim() || s.length > maxLength)) throw new Error(`${label}: introduce una lista válida de hasta 50 elementos.`);
  return [...new Set((value as string[]).map((s) => s.trim()))];
}
export function parsePlanInput(value: unknown): PlanInput {
  if (!isRecord(value)) throw new Error("Introduce una planificación válida.");
  const allowed = ["storeId", "budget", "days", "people", "preferenceIds", "allergyIds", "excludedIngredients", "strategy", "requestKey"];
  if (Object.keys(value).some((key) => !allowed.includes(key))) throw new Error("La solicitud contiene campos no permitidos.");
  const { storeId, budget, days, people } = value;
  if (typeof storeId !== "string" || !storeId.trim() || storeId.length > 128) throw new Error("Selecciona un supermercado.");
  if (typeof budget !== "number" || !Number.isFinite(budget) || budget < 20 || budget > 1000 || Math.abs(budget * 100 - Math.round(budget * 100)) > .000001) throw new Error("El presupuesto debe estar entre $20 y $1000, con un máximo de dos decimales.");
  if (typeof days !== "number" || !Number.isInteger(days) || days < 1 || days > 7) throw new Error("Elige entre 1 y 7 días.");
  if (typeof people !== "number" || !Number.isInteger(people) || people < 1 || people > 12) throw new Error("Elige entre 1 y 12 personas.");
  const strategy = value.strategy ?? "standard";
  if (strategy !== "standard" && strategy !== "economical" && strategy !== "reduce-days") throw new Error("El ajuste de presupuesto no es válido.");
  if (value.requestKey !== undefined && (typeof value.requestKey !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestKey))) throw new Error("La clave de solicitud no es válida.");
  const excludedIngredients = list(value.excludedIngredients, "Ingredientes excluidos", 100);
  if (excludedIngredients.some((s) => !normalize(s))) throw new Error("Introduce nombres de ingredientes válidos.");
  return { storeId: storeId.trim(), budget, days, people, preferenceIds: list(value.preferenceIds, "Preferencias"), allergyIds: list(value.allergyIds, "Alergias"),
    excludedIngredients: excludedIngredients.filter((name, i) => excludedIngredients.findIndex((s) => normalize(s) === normalize(name)) === i), strategy, requestKey: value.requestKey as string | undefined };
}
export function parseBooleanPatch(value: unknown, key: string): boolean {
  if (!isRecord(value) || typeof value[key] !== "boolean" || Object.keys(value).some((k) => k !== key)) throw new Error(`Envía únicamente ${key} como true o false.`);
  return value[key];
}
