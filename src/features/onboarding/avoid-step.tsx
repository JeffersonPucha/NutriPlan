"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/features/plan/plan-store";
import { normalize } from "@/lib/domain/validation";
import type { StepProps } from "./step-types";

export function AvoidStep({ value, onChange }: StepProps) {
  const { catalogs } = usePlan();
  const avoidedSuggestions = catalogs.products.slice(0, 6).map((p) => p.nombre).filter((name) => !value.avoidedItems.some((item) => normalize(item) === normalize(name)));
  const [input, setInput] = useState("");
  function add(item: string) { const clean = item.trim(); if (normalize(clean) && !value.avoidedItems.some((s) => normalize(s) === normalize(clean))) onChange({ avoidedItems: [...value.avoidedItems, clean] }); setInput(""); }
  return <div className="space-y-5"><div className="flex gap-2"><input className="input min-w-0 flex-1" aria-label="Ingrediente a evitar" placeholder="Ej. brócoli, cebolla, atún…" maxLength={100} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(input); } }} /><Button disabled={!input.trim()} onClick={() => add(input)}>Agregar</Button></div>
    <div className="flex flex-wrap gap-2" aria-label="Ingredientes excluidos">{value.avoidedItems.map((item) => <button key={item} type="button" className="choice-chip selected-danger" aria-label={`Quitar ${item}`} onClick={() => onChange({ avoidedItems: value.avoidedItems.filter((s) => s !== item) })}>{item}<X size={14} aria-hidden="true" /></button>)}</div>
    {!!avoidedSuggestions.length && <div><p className="eyebrow mb-3">Sugerencias</p><div className="flex flex-wrap gap-2">{avoidedSuggestions.map((item) => <button key={item} type="button" className="choice-chip" onClick={() => add(item)}><Plus size={16} aria-hidden="true" />{item}</button>)}</div></div>}
    {!!value.avoidedItems.length && <Button variant="ghost" onClick={() => onChange({ avoidedItems: [] })}>Quitar todos</Button>}</div>;
}
