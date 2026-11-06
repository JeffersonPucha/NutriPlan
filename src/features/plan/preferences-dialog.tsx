"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/domain/format";
import type { Preferences } from "@/lib/domain/types";
import { usePlanCreation } from "./use-plan-creation";
import { MarketStep } from "@/features/onboarding/market-step";
import { BudgetStep } from "@/features/onboarding/budget-step";
import { ScopeStep } from "@/features/onboarding/scope-step";
import { GoalsStep } from "@/features/onboarding/goals-step";
import { AllergiesStep } from "@/features/onboarding/allergies-step";
import { AvoidStep } from "@/features/onboarding/avoid-step";
import { GenerationDialog } from "./generation-dialog";

export function PreferencesDialog({ initial, onClose }: { initial: Preferences; onClose: () => void }) {
  const [value, setValue] = useState(initial);
  const creation = usePlanCreation(onClose);
  const onChange = (patch: Partial<Preferences>) => setValue((old) => ({ ...old, ...patch }));
  const sections = [
    { label: "Establecimiento", summary: value.market, Component: MarketStep },
    { label: "Presupuesto", summary: money(value.budget), Component: BudgetStep },
    { label: "Días y personas", summary: `${value.days} ${value.days === 1 ? "día" : "días"} · ${value.people} ${value.people === 1 ? "persona" : "personas"}`, Component: ScopeStep },
    { label: "Preferencias", summary: value.goals.join(", ") || "Sin preferencias adicionales", Component: GoalsStep },
    { label: "Alergias", summary: value.allergies.join(", ") || "Sin alergias declaradas", Component: AllergiesStep },
    { label: "Ingredientes excluidos", summary: value.avoidedItems.join(", ") || "Ninguno", Component: AvoidStep },
  ];
  return <><Modal title="Filtros y preferencias" closeDisabled={creation.busy} onClose={onClose} wide><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void creation.submit(value); }} onInvalidCapture={(event) => { if (event.target instanceof HTMLElement) event.target.closest("details")?.setAttribute("open", ""); }}>
    <p className="text-secondary text-sm leading-relaxed">Los cambios se aplican al generar un nuevo plan. Se reiniciarán las marcas de compras y comidas preparadas.</p>
    <div className="preferences-sections">{sections.map(({ label, summary, Component }) => <details className="preferences-section" key={label} open={label === "Presupuesto"}>
      <summary><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="text-secondary mt-1 block text-xs leading-relaxed">{summary}</span></span><ChevronDown size={18} aria-hidden="true" /></summary>
      <div className="pb-5 pt-2"><Component value={value} onChange={onChange} /></div>
    </details>)}</div>
    {creation.error && <p className="form-error" role="alert">{creation.error}</p>}<div className="dialog-actions"><Button variant="secondary" disabled={creation.busy} onClick={onClose}>Cancelar</Button><Button disabled={creation.busy} type="submit">{creation.busy ? "Preparando tu planificación…" : "Generar nuevo plan"}<ArrowRight size={18} aria-hidden="true" /></Button></div>
  </form></Modal>{creation.budgetIssue && <GenerationDialog issue={creation.budgetIssue} busy={creation.busy} error={creation.error}
    onClose={creation.clearBudgetIssue} onEdit={() => { creation.clearBudgetIssue(); window.setTimeout(() => { const input = document.getElementById("budget"); input?.closest("details")?.setAttribute("open", ""); input?.focus(); }, 0); }}
    onAdjust={(strategy) => void creation.submit(creation.budgetIssue!.preferences, strategy)} />}</>;
}
