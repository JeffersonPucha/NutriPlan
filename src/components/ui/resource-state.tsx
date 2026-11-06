"use client";
import { RefreshCw } from "lucide-react";
import { Button } from "./button";
import { loadCatalogs, usePlan } from "@/features/plan/plan-store";
export function CatalogState({ empty, children }: { empty: boolean; children: React.ReactNode }) {
  const state = usePlan();
  if (state.catalogLoading) return <div className="card text-secondary" role="status">Cargando opciones de tu planificación…</div>;
  if (state.catalogError) return <div className="card space-y-3" role="alert"><p>{state.catalogError}</p><Button variant="secondary" onClick={() => void loadCatalogs()}><RefreshCw size={16} />Volver a intentar</Button></div>;
  if (empty) return <div className="card text-secondary" role="status">No hay opciones disponibles en este momento.</div>;
  return children;
}
export function ConnectionError({ message, retry }: { message: string; retry: () => void }) {
  return <div className="loading-screen px-6 text-center" role="alert"><h2 className="text-xl">No pudimos cargar tu planificación</h2><p className="text-secondary max-w-md text-sm">{message}</p><Button onClick={retry}><RefreshCw size={17} />Volver a intentar</Button></div>;
}
