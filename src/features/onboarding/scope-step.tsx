import { Minus, Plus, Users } from "lucide-react";
import type { StepProps } from "./step-types";

export function DaysStep({ value, onChange }: StepProps) {
  return <fieldset><legend className="sr-only">Días a planificar</legend>
    <div className="days-options">{[1, 2, 3, 4, 5, 6, 7].map((days) => <label key={days} className={`calendar-day ${value.days === days ? "active" : ""}`}>
      <input className="sr-only" type="radio" name="days" aria-label={`${days} ${days === 1 ? "día" : "días"}`} value={days} checked={value.days === days} onChange={() => onChange({ days })} />
      <strong>{days}</strong><span>{days === 1 ? "día" : "días"}</span>
    </label>)}</div>
  </fieldset>;
}

export function PeopleStep({ value, onChange }: StepProps) {
  return <section className="people-selector"><span className="option-icon"><Users size={24} aria-hidden="true" /></span>
    <div><h3 className="text-sm">Personas</h3><p className="text-secondary mt-1 text-xs">De 1 a 12 comensales</p></div>
    <div className="counter"><button type="button" aria-label="Menos personas" disabled={value.people <= 1} onClick={() => onChange({ people: value.people - 1 })}><Minus size={18} aria-hidden="true" /></button><output aria-live="polite" aria-label="Cantidad de personas">{value.people}</output><button type="button" aria-label="Más personas" disabled={value.people >= 12} onClick={() => onChange({ people: value.people + 1 })}><Plus size={18} aria-hidden="true" /></button></div>
  </section>;
}

export function ScopeStep(props: StepProps) {
  return <div className="space-y-5"><DaysStep {...props} /><PeopleStep {...props} /></div>;
}
