"use client";
import { CalendarMinus, PiggyBank, SlidersHorizontal } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/domain/format";
import type { Preferences, PlanStrategy } from "@/lib/domain/types";
export function GenerationDialog({ issue, busy, error, onAdjust, onClose, onEdit }: {
  issue: { preferences: Preferences; estimate: number }; busy: boolean; error: string;
  onAdjust: (strategy: PlanStrategy) => void; onClose: () => void; onEdit: () => void;
}) {
  return <Modal title="Ajustemos tu presupuesto" closeDisabled={busy} onClose={onClose}><div className="space-y-5">
    <span className="celebration-icon warning-icon"><PiggyBank size={34} aria-hidden="true" /></span>
    <div className="text-center"><h3 className="text-2xl">Nos faltan {money(issue.estimate - issue.preferences.budget)}</h3><p className="text-secondary mt-2 text-sm leading-relaxed">La canasta se estima en {money(issue.estimate)} con los precios de tu supermercado. Conservaremos tus alergias y restricciones al ajustarla.</p></div>
    <div className="space-y-3"><Button disabled={busy} className="w-full" onClick={() => onAdjust("economical")}><PiggyBank size={18} />Optimizar con platos económicos</Button><Button disabled={busy} className="w-full" variant="secondary" onClick={() => onAdjust("reduce-days")}><CalendarMinus size={18} />Reducir días para que alcance</Button><Button disabled={busy} className="w-full" variant="ghost" onClick={onEdit}><SlidersHorizontal size={18} />Editar presupuesto</Button></div>
    {busy && <p role="status" className="text-secondary text-sm">Preparando tu planificación…</p>}{error && <p className="form-error" role="alert">{error}</p>}
  </div></Modal>;
}
