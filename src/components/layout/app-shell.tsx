"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Leaf, Moon, SlidersHorizontal, Sun } from "lucide-react";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { PreferencesDialog } from "@/features/plan/preferences-dialog";
import { planActions, refreshPlan, usePlan } from "@/features/plan/plan-store";
import { ConnectionError } from "@/components/ui/resource-state";
import { Navigation } from "./navigation";

export function AppShell({ children }: { children: ReactNode }) {
  const { hydrated, plan, theme, loading, error } = usePlan(); const router = useRouter(); const [preferencesOpen, setPreferencesOpen] = useState(false);
  useEffect(() => { if (hydrated && !loading && !error && !plan) router.replace("/onboarding"); }, [hydrated, loading, error, plan, router]);
  if (error) return <ConnectionError message={error} retry={() => void refreshPlan()} />;
  if (!hydrated || !plan) return <LoadingScreen />;
  return <div className="app-shell"><a href="#contenido" className="skip-link">Saltar al contenido</a>
    <aside className="desktop-sidebar"><Link className="brand" href="/"><span className="brand-icon"><Leaf size={24} aria-hidden="true" /></span>Nutri<span>Plan</span></Link><p className="text-secondary mt-2 pl-1 text-xs">Un plan para comer mejor.</p><p className="eyebrow mb-4 mt-12 pl-3">TU ESPACIO</p><Navigation /><div className="sidebar-bottom"><Link href="/onboarding" className="button button-secondary w-full">Crear otro plan<ArrowUpRight size={18} aria-hidden="true" /></Link></div></aside>
    <div className="app-main"><header className="app-header"><Link className="brand lg:hidden" href="/"><span className="brand-icon"><Leaf size={21} aria-hidden="true" /></span>Nutri<span>Plan</span></Link><p className="text-secondary hidden text-xs lg:block">Planifica con calma. Disfruta cada comida.</p><div className="flex items-center gap-1.5 sm:gap-3"><button type="button" className="market-header-button" aria-label="Abrir filtros y preferencias" onClick={() => setPreferencesOpen(true)}><SlidersHorizontal size={18} aria-hidden="true" /><span className="hidden sm:inline">{plan.preferences.market === "Mercado Local / Otro" ? "Mercado local" : plan.preferences.market}</span><span className="sm:hidden">Filtros</span></button><button type="button" className="icon-button" aria-label={theme === "light" ? "Activar tema oscuro" : "Activar tema claro"} onClick={planActions.toggleTheme}>{theme === "light" ? <Moon size={20} /> : <Sun size={20} />}</button></div></header>
      <main id="contenido" className="page-content">{children}</main><Navigation mobile />
    </div>{preferencesOpen && <PreferencesDialog initial={plan.preferences} onClose={() => setPreferencesOpen(false)} />}
  </div>;
}
