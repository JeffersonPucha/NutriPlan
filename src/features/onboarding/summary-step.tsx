import { CalendarDays, Pencil, ShieldCheck, SlidersHorizontal, Store, Users, Wallet, Carrot } from "lucide-react";
import { money } from "@/lib/domain/format";
import type { Preferences } from "@/lib/domain/types";

export function SummaryStep({ value, onEdit }: { value: Preferences; onEdit: (step: number) => void }) {
  const rows = [
    { icon: Store, title: "Establecimiento", detail: value.market || "Sin seleccionar", step: 0 },
    { icon: Wallet, title: "Presupuesto", detail: `${money(value.budget)} máximo`, step: 1 },
    { icon: CalendarDays, title: "Días", detail: `${value.days} ${value.days === 1 ? "día" : "días"}`, step: 2 },
    { icon: Users, title: "Personas", detail: `${value.people} ${value.people === 1 ? "persona" : "personas"}`, step: 3 },
    { icon: SlidersHorizontal, title: "Preferencias", detail: value.goals.join(", ") || "Sin preferencias adicionales", step: 4 },
    { icon: ShieldCheck, title: "Alergias", detail: value.allergies.join(", ") || "Sin alergias declaradas", step: 5 },
    { icon: Carrot, title: "Ingredientes excluidos", detail: value.avoidedItems.join(", ") || "Ninguno", step: 6 },
  ];
  return <div className="space-y-4"><div className="divide-y divide-[var(--border)]">{rows.map(({ icon: Icon, title, detail, step }) => <div key={title} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"><Icon size={20} className="text-green mt-2 shrink-0" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-secondary mb-1 text-xs">{title}</p><p className="text-sm font-semibold leading-relaxed">{detail}</p></div><button type="button" className="icon-button" aria-label={`Editar ${title.toLowerCase()}`} onClick={() => onEdit(step)}><Pencil size={18} aria-hidden="true" /></button></div>)}</div><p className="text-secondary text-xs leading-relaxed">Los precios son estimados y pueden variar en la tienda.</p></div>;
}
