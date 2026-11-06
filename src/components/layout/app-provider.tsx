"use client";

import { useEffect, type ReactNode } from "react";
import { Check, TriangleAlert, X } from "lucide-react";
import { hydratePlanStore, planActions, syncBrowserState, usePlan } from "@/features/plan/plan-store";
import { PwaRegistration } from "@/components/pwa/pwa-registration";

export function AppProvider({ children }: { children: ReactNode }) {
  const state = usePlan();
  useEffect(() => { hydratePlanStore(); window.addEventListener("storage", syncBrowserState); return () => window.removeEventListener("storage", syncBrowserState); }, []);
  useEffect(() => { if (state.hydrated) document.documentElement.dataset.theme = state.theme; }, [state.hydrated, state.theme]);
  useEffect(() => { if (!state.message) return; const timer = window.setTimeout(planActions.clearMessage, 4000); return () => clearTimeout(timer); }, [state.message]);
  return <>{children}<PwaRegistration />
    {state.mutationError && <div className="storage-alert" role="alert"><TriangleAlert size={20} aria-hidden="true" /><p>{state.mutationError}</p><button type="button" className="icon-button" aria-label="Cerrar aviso de operación" onClick={planActions.dismissMutationError}><X size={18} /></button></div>}
    {state.message && <div className="toast" role="status"><Check size={18} aria-hidden="true" />{state.message}</div>}
  </>;
}
