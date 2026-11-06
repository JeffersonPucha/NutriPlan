import { Building2, Check, MapPin, ShoppingBasket, Store, Warehouse } from "lucide-react";
import { usePlan } from "@/features/plan/plan-store";
import { CatalogState } from "@/components/ui/resource-state";
import type { StepProps } from "./step-types";
const icons = [Store, Warehouse, ShoppingBasket, Building2, MapPin];
export function MarketStep({ value, onChange }: StepProps) {
  const { catalogs } = usePlan();
  return <CatalogState empty={!catalogs.stores.length}><fieldset className="space-y-3"><legend className="sr-only">Selecciona tu establecimiento</legend>
    {catalogs.stores.map((market, index) => { const Icon = icons[index % icons.length]; return <label key={market.id} className={`market-option ${value.storeId === market.id ? "selected" : ""}`}>
      <input type="radio" name="market" value={market.id} checked={value.storeId === market.id} onChange={() => onChange({ storeId: market.id, market: market.nombre })} className="sr-only" />
      <span className={`option-icon option-icon-${index % 3}`}><Icon size={24} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1 text-sm font-bold">{market.nombre}</span>
      <span className="selection-indicator">{value.storeId === market.id && <Check size={15} aria-hidden="true" />}</span>
    </label>; })}
  </fieldset></CatalogState>;
}
