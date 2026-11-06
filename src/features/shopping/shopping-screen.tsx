"use client";

import { Beef, Carrot, Check, Egg, ShoppingBasket, Wheat } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { Progress } from "@/components/ui/progress";
import { money, quantity } from "@/lib/domain/format";
import { planActions, usePlan } from "@/features/plan/plan-store";

const categoryIcons = { "Carnes y proteínas": Beef, "Frutas y verduras": Carrot, "Granos y despensa": Wheat, "Lácteos y huevos": Egg };
export function ShoppingScreen() {
  const { plan, pendingIds } = usePlan();
  if (!plan) return null;
  const checked = plan.shopping.filter((item) => item.checked).length;
  const percent = plan.shopping.length ? Math.round(checked / plan.shopping.length * 100) : 0;
  const categories = [...new Set(plan.shopping.map((item) => item.category))];
  return <div className="space-y-6"><PageHeading eyebrow="LISTA DE COMPRAS" title="Todo para tu semana." description={`${plan.preferences.market} · Para ${plan.preferences.people} ${plan.preferences.people === 1 ? "persona" : "personas"}.`} action={<div className="shopping-total"><p className="eyebrow">TOTAL ESTIMADO</p><p className="text-green mt-1 text-3xl font-bold">{money(plan.total)}</p></div>} />
    <section className="space-y-3" aria-label="Estado de la compra"><p className="text-secondary text-sm" aria-live="polite"><strong className="text-green">{checked} de {plan.shopping.length}</strong> artículos comprados</p><Progress label="Progreso de compras" value={percent} /></section>
    {!plan.shopping.length && <p className="empty-state" role="status">Tu lista de compras está vacía.</p>}
    <div className="grid items-start gap-6 md:grid-cols-2">{categories.map((category) => {
      const Icon = categoryIcons[category as keyof typeof categoryIcons] ?? ShoppingBasket;
      const items = plan.shopping.filter((item) => item.category === category);
      return <section key={category} className="space-y-3"><h2 className="section-title flex items-center gap-2"><Icon size={20} aria-hidden="true" />{category}</h2><div className="card divide-y divide-[var(--border)] py-1">{items.map((item) => <label key={item.key} className={`shopping-row ${item.checked ? "is-checked" : ""}`} aria-busy={pendingIds.includes(item.id)}>
        <input type="checkbox" disabled={pendingIds.includes(item.id)} checked={item.checked} aria-label={`Comprado: ${item.name}`} onChange={() => planActions.toggleShopping(item.key)} />
        <span className="shopping-check" aria-hidden="true">{item.checked && <Check size={16} />}</span><span className="min-w-0 flex-1"><span className="item-name block text-sm font-semibold">{item.name}</span><span className="text-secondary mt-1 block text-xs">{quantity(item.qty, item.unit)}</span></span><strong className="shrink-0 text-sm">{money(item.cost)}</strong>
      </label>)}</div></section>;
    })}</div>
    <p className="text-secondary text-xs leading-relaxed">Cantidades por consumo. El precio final depende de las presentaciones y los precios de la tienda.</p>
  </div>;
}
