import { PiggyBank, Store, Wallet } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { money } from "@/lib/domain/format";
import type { MealPlan } from "@/lib/domain/types";

export function BudgetCard({ plan }: { plan: MealPlan }) {
  const free = plan.preferences.budget - plan.total;
  const percentage = plan.total / plan.preferences.budget * 100;
  return <section className="card budget-card">
    <div className="flex items-start justify-between gap-3"><div><h2 className="eyebrow flex items-center gap-2"><Wallet size={16} aria-hidden="true" />COSTO ESTIMADO</h2>
      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1"><strong className="text-4xl tracking-tight">{money(plan.total)}</strong><span className="text-secondary text-sm">de {money(plan.preferences.budget)}</span></p>
    </div><span className="budget-decoration"><PiggyBank size={30} strokeWidth={1.5} aria-hidden="true" /></span></div>
    <div className="mt-5"><Progress value={percentage} label="Presupuesto utilizado" /><div className="text-secondary mt-2 flex flex-wrap justify-between gap-2 text-xs"><span>{percentage.toFixed(0)}% del presupuesto</span><span className="text-green font-semibold">{money(free)} disponibles</span></div></div>
    <p className="mt-5 flex items-center gap-2 text-sm font-semibold"><Store size={18} className="text-green shrink-0" aria-hidden="true" />{plan.preferences.market}</p>
    <p className="text-secondary mt-2 text-xs">{plan.preferences.days} {plan.preferences.days === 1 ? "día" : "días"} · {plan.preferences.people} {plan.preferences.people === 1 ? "persona" : "personas"}</p>
    <p className="text-secondary mt-4 text-xs leading-relaxed">Estimación por consumo. Los precios y las presentaciones pueden variar en la tienda.</p>
  </section>;
}
