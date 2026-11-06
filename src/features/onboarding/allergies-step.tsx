import { Check, ShieldCheck } from "lucide-react";
import { toggleValue } from "@/lib/domain/preferences";
import { usePlan } from "@/features/plan/plan-store";
import { CatalogState } from "@/components/ui/resource-state";
import type { StepProps } from "./step-types";
export function AllergiesStep({ value, onChange }: StepProps) {
  const { catalogs } = usePlan();
  return <CatalogState empty={!catalogs.allergies.length}><div className="space-y-5"><button type="button" className={`market-option w-full ${value.hasNoAllergies ? "selected" : ""}`} aria-pressed={value.hasNoAllergies} onClick={() => onChange({ hasNoAllergies: !value.hasNoAllergies, allergyIds: [], allergies: [] })}><ShieldCheck size={24} aria-hidden="true" /><span className="flex-1 text-left text-sm font-bold">No tengo alergias</span>{value.hasNoAllergies && <Check size={18} aria-hidden="true" />}</button>
    <div className="flex flex-wrap gap-2.5">{catalogs.allergies.map((allergy) => <button key={allergy.id} type="button" disabled={value.hasNoAllergies} className={`choice-chip ${value.allergyIds.includes(allergy.id) ? "selected-danger" : ""}`} aria-pressed={value.allergyIds.includes(allergy.id)} onClick={() => {
      const ids = toggleValue(value.allergyIds, allergy.id); onChange({ allergyIds: ids, allergies: catalogs.allergies.filter((a) => ids.includes(a.id)).map((a) => a.nombre) });
    }}>{value.allergyIds.includes(allergy.id) && <Check size={16} aria-hidden="true" />}{allergy.nombre}</button>)}</div></div></CatalogState>;
}
