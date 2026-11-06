"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Leaf, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { Progress } from "@/components/ui/progress";
import { ConnectionError } from "@/components/ui/resource-state";
import { usePlanCreation } from "@/features/plan/use-plan-creation";
import type { Preferences } from "@/lib/domain/types";
import { planActions, refreshPlan, usePlan } from "@/features/plan/plan-store";
import { GenerationDialog } from "@/features/plan/generation-dialog";
import { MarketStep } from "./market-step";
import { BudgetStep } from "./budget-step";
import { DaysStep, PeopleStep } from "./scope-step";
import { GoalsStep } from "./goals-step";
import { AllergiesStep } from "./allergies-step";
import { AvoidStep } from "./avoid-step";
import { SummaryStep } from "./summary-step";

const steps = [
  { label: "Establecimiento", title: "¿Dónde compras esta semana?", description: "Calcularemos los precios según tu supermercado.", component: MarketStep },
  { label: "Presupuesto", title: "¿Cuánto quieres gastar?", description: "El límite para todas las comidas de tu plan.", component: BudgetStep },
  { label: "Días", title: "¿Cuántos días quieres planificar?", description: "Incluiremos una comida principal por día.", component: DaysStep },
  { label: "Personas", title: "¿Para cuántas personas?", description: "Ajustaremos los ingredientes y las compras a estas porciones.", component: PeopleStep },
  { label: "Objetivos", title: "¿Qué te importa?", description: "Puedes elegir varias preferencias o continuar sin ellas.", component: GoalsStep },
  { label: "Alergias", title: "¿Tienes alguna alergia?", description: "Excluiremos las recetas que declaran los alérgenos seleccionados.", component: AllergiesStep },
  { label: "Ingredientes", title: "¿Algo que prefieres evitar?", description: "Añade los ingredientes que no quieres en tus recetas.", component: AvoidStep },
  { label: "Resumen", title: "Todo listo para tu semana", description: "Revisa tus preferencias. Puedes editar cualquier detalle antes de empezar." },
];

function Wizard({ initial, hasPlan }: { initial: Preferences; hasPlan: boolean }) {
  const router = useRouter(); const { theme, catalogs, catalogLoading, catalogError } = usePlan();
  const stateCatalogUnavailable = catalogLoading || !!catalogError;
  const [value, setValue] = useState(initial); const [step, setStep] = useState(0);
  const creation = usePlanCreation(() => router.push("/"));
  const error = creation.error;
  const current = steps[step]; const Step = current.component;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: "instant" }); }, [step]);
  const valid = step === 0 ? catalogs.stores.some((s) => s.id === value.storeId) : step === 1 ? value.budget >= 20 && value.budget <= 1000 : true;
  function change(patch: Partial<Preferences>) { setValue((old) => ({ ...old, ...patch })); }
  function next() {
    if (step < steps.length - 1) { setStep(step + 1); return; }
    void creation.submit(value);
  }
  function skip() {
    if (step === 4) change({ goals: [], preferenceIds: [] }); if (step === 5) change({ allergies: [], allergyIds: [], hasNoAllergies: true }); if (step === 6) change({ avoidedItems: [] });
    setStep(step + 1);
  }
  return <div className="onboarding-shell"><header className="onboarding-header"><Link href={hasPlan ? "/" : "/onboarding"} className="brand"><span className="brand-icon"><Leaf size={23} aria-hidden="true" /></span>Nutri<span>Plan</span></Link><div className="flex items-center gap-2">{hasPlan && <Link className="text-link" href="/">Conservar mi plan</Link>}<button type="button" className="icon-button" aria-label={theme === "light" ? "Activar tema oscuro" : "Activar tema claro"} onClick={planActions.toggleTheme}>{theme === "light" ? <Moon size={20} /> : <Sun size={20} />}</button></div></header>
    <div className="onboarding-grid"><aside className="onboarding-aside"><div><span className="eyebrow">TU SEMANA EMPIEZA AQUÍ</span><h2 className="mt-4 text-4xl leading-tight tracking-tight">Un buen plan.<br />Un poquito<br /><span className="text-green">más de calma.</span></h2><p className="text-secondary mt-5 max-w-xs text-sm leading-relaxed">Comidas que te gustan, compras con sentido y tiempo para lo que importa.</p></div><ol className="mt-9 space-y-2">{steps.map((item, i) => <li key={item.label} className={`wizard-step ${i === step ? "active" : ""}`} aria-current={i === step ? "step" : undefined}><span>{i < step ? <Check size={15} aria-hidden="true" /> : i + 1}</span>{item.label}</li>)}</ol><p className="text-secondary mt-8 text-xs">Hecho para tu día a día.</p></aside>
      <main id="contenido" className="onboarding-main"><div className="mb-7 space-y-3"><div className="flex justify-between text-xs font-semibold"><span className="text-green">Paso {step + 1} de {steps.length}</span><span className="text-secondary">{current.label}</span></div><Progress label="Progreso de configuración" value={(step + 1) / steps.length * 100} /></div>
        <div className="mb-7 space-y-3"><h1 ref={heading} tabIndex={-1} className="wizard-heading text-[28px] sm:text-3xl">{current.title}</h1><p className="text-secondary text-sm leading-relaxed">{current.description}</p></div>
        {Step ? <Step value={value} onChange={change} /> : <SummaryStep value={value} onEdit={setStep} />}
        {error && <p className="form-error mt-5" role="alert">{error}</p>}
        <footer className="wizard-footer"><Button variant="ghost" aria-label="Paso anterior" disabled={step === 0 || creation.busy} onClick={() => { setStep(step - 1); }}><ArrowLeft size={18} /><span className="hidden sm:inline">Volver</span></Button><div className="flex items-center gap-2">{step >= 4 && step <= 6 && <Button variant="ghost" onClick={skip}>Omitir</Button>}<Button disabled={!valid || creation.busy || stateCatalogUnavailable} onClick={next}>{creation.busy ? "Preparando tu planificación…" : step === steps.length - 1 ? "Generar mi plan" : "Continuar"}<ArrowRight size={18} /></Button></div></footer>
      </main></div>
    {creation.budgetIssue && <GenerationDialog issue={creation.budgetIssue} busy={creation.busy} error={creation.error}
      onClose={creation.clearBudgetIssue} onEdit={() => { creation.clearBudgetIssue(); setStep(1); }}
      onAdjust={(strategy) => void creation.submit(creation.budgetIssue!.preferences, strategy)} />}
  </div>;
}

export function OnboardingFlow() {
  const state = usePlan();
  if (state.error) return <ConnectionError message={state.error} retry={() => void refreshPlan()} />;
  if (!state.hydrated || state.loading) return <LoadingScreen />;
  return <Wizard initial={state.preferences} hasPlan={!!state.plan} />;
}
