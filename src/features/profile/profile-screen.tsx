"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Leaf, Moon, RefreshCw, ShieldCheck, SlidersHorizontal, Smartphone, Sun, UserRound } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { money } from "@/lib/domain/format";
import { planActions, usePlan } from "@/features/plan/plan-store";
import { PreferencesDialog } from "@/features/plan/preferences-dialog";
import { InstallApp } from "@/components/pwa/install-app";

export function ProfileScreen() {
  const { plan, profile, theme, pendingIds } = usePlan(); const [name, setName] = useState(profile.name); const [preferencesOpen, setPreferencesOpen] = useState(false);
  if (!plan) return null;
  const preferences = plan.preferences;
  return <div className="space-y-6"><PageHeading eyebrow="TU ESPACIO PERSONAL" title="Un plan que va contigo." description="Tus preferencias, tus hábitos, a tu ritmo." />
    <div className="grid items-start gap-6 md:grid-cols-2"><div className="space-y-5"><section className="card"><div className="mb-6 flex items-center gap-4"><span className="profile-avatar"><UserRound size={31} strokeWidth={1.5} aria-hidden="true" /></span><div><h2 className="text-xl">{profile.name || "Tu perfil"}</h2></div></div><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); planActions.setName(name); }}><label htmlFor="profile-name" className="text-xs font-semibold">¿Cómo te llamas?</label><input id="profile-name" className="input" placeholder="Tu nombre" autoComplete="given-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} /><Button disabled={pendingIds.includes("profile") || name.trim() === profile.name} type="submit"><Check size={18} aria-hidden="true" />{pendingIds.includes("profile") ? "Guardando…" : "Guardar perfil"}</Button></form></section>
      <section className="card space-y-4"><h2 className="section-title">A tu manera</h2><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3">{theme === "light" ? <Sun size={22} aria-hidden="true" /> : <Moon size={22} aria-hidden="true" />}<div><p className="text-sm font-semibold">Apariencia</p><p className="text-secondary mt-1 text-xs">Tema {theme === "light" ? "claro" : "oscuro"}</p></div></div><button type="button" role="switch" aria-checked={theme === "dark"} aria-label="Tema oscuro" className="theme-switch" onClick={planActions.toggleTheme}><span /></button></div></section>
      <section className="card space-y-3"><h2 className="section-title flex items-center gap-2"><Smartphone size={20} aria-hidden="true" />NutriPlan a mano</h2><p className="text-secondary text-sm leading-relaxed">Añade NutriPlan a tu pantalla de inicio para acceder más fácilmente.</p><InstallApp /></section>
    </div><div className="space-y-5"><section className="card space-y-5"><div className="flex items-center justify-between"><h2 className="section-title">Tu planificación actual</h2><Leaf size={22} className="text-green" aria-hidden="true" /></div><div className="space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-secondary">Establecimiento</span><strong className="text-right">{preferences.market}</strong></div><div className="flex justify-between"><span className="text-secondary">Presupuesto</span><strong>{money(preferences.budget)}</strong></div><div className="flex justify-between"><span className="text-secondary">Días y personas</span><strong>{preferences.days} {preferences.days === 1 ? "día" : "días"} · {preferences.people} {preferences.people === 1 ? "persona" : "personas"}</strong></div></div><div className="flex flex-wrap gap-2">{preferences.goals.map((goal) => <Badge key={goal}>{goal}</Badge>)}{preferences.allergies.map((a) => <Badge key={a} tone="danger">Sin {a.toLowerCase()}</Badge>)}{preferences.avoidedItems.map((item) => <Badge key={item} tone="peach">Evitar: {item}</Badge>)}</div><Button variant="secondary" className="w-full" onClick={() => setPreferencesOpen(true)}><SlidersHorizontal size={17} />Editar filtros y preferencias</Button><Link className="button button-ghost w-full" href="/onboarding"><RefreshCw size={16} />Volver al asistente<ArrowRight size={16} /></Link></section>
      <div className="info-note"><ShieldCheck size={24} aria-hidden="true" /><p>Modo de prueba: este perfil es compartido. Los cambios pueden verse en otros dispositivos.</p></div>
    </div></div>{preferencesOpen && <PreferencesDialog initial={preferences} onClose={() => setPreferencesOpen(false)} />}
  </div>;
}
