import { LayoutPanelTop } from "lucide-react";

/** Solo una reserva visual. No carga scripts, anuncios, cookies ni rastreadores. */
export function AdSlot({ placement, compact = false }: { placement: string; compact?: boolean }) {
  return <aside className={`ad-slot ${compact ? "ad-slot-compact" : ""}`} aria-label="Espacio publicitario de demostración" data-placement={placement}>
    <LayoutPanelTop size={20} aria-hidden="true" /><div><p className="text-xs font-semibold">Espacio para futuras recomendaciones</p><p className="text-secondary mt-1 text-[11px]">Placeholder de desarrollo · Sin publicidad activa</p></div>
  </aside>;
}
