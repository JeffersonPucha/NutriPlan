import { Check, Plus } from "lucide-react";
import { toggleValue } from "@/lib/domain/preferences";
import { usePlan } from "@/features/plan/plan-store";
import { CatalogState } from "@/components/ui/resource-state";
import type { StepProps } from "./step-types";
export function GoalsStep({ value, onChange }: StepProps) {
  const { catalogs } = usePlan();
  return <CatalogState empty={!catalogs.preferences.length}><div className="flex flex-wrap gap-2.5">{catalogs.preferences.map((goal) => { const active = value.preferenceIds.includes(goal.id); return <button key={goal.id} type="button" className={`choice-chip ${active ? "selected" : ""}`} aria-pressed={active} onClick={() => {
    const ids = toggleValue(value.preferenceIds, goal.id); onChange({ preferenceIds: ids, goals: catalogs.preferences.filter((p) => ids.includes(p.id)).map((p) => p.nombre) });
  }}>{active ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{goal.nombre}</button>; })}</div></CatalogState>;
}
