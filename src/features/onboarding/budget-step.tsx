import { Button } from "@/components/ui/button";
import type { StepProps } from "./step-types";

export function BudgetStep({ value, onChange }: StepProps) {
  return <section className="budget-selector space-y-5 text-center"><label htmlFor="budget" className="eyebrow block">Presupuesto máximo · USD</label>
    <div className="budget-input"><span aria-hidden="true">$</span><input id="budget" aria-label="Presupuesto máximo en dólares" aria-describedby="budget-hint" type="number" inputMode="decimal" min={20} max={1000} step={1} value={value.budget || ""} onChange={(event) => onChange({ budget: Number(event.target.value) })} /></div>
    <p id="budget-hint" className="text-secondary text-xs">Ingresa entre $20 y $1000.</p>
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Presupuestos sugeridos">{[30, 50, 70, 100].map((amount) => <Button key={amount} aria-pressed={value.budget === amount} variant={value.budget === amount ? "primary" : "secondary"} onClick={() => onChange({ budget: amount })}>${amount}</Button>)}</div>
  </section>;
}
