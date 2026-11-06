"use client";

import { useState } from "react";
import { ArrowRight, Clock3, Search, SearchX } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { Badge } from "@/components/ui/badge";
import { normalize } from "@/lib/domain/validation";
import { usePlan } from "@/features/plan/plan-store";
import { RecipeArtwork } from "./recipe-artwork";
import { RecipeDialog } from "./recipe-dialog";

export function RecipesScreen() {
  const { plan } = usePlan(); const [query, setQuery] = useState(""); const [selected, setSelected] = useState<number | null>(null);
  if (!plan) return null;
  const unique = [...new Map(plan.meals.map((m) => [m.recipe.id, m.recipe])).values()]; const visible = unique.filter((r) => normalize([r.name, ...r.tags, ...r.ingredients.map((i) => i.name)].join(" ")).includes(normalize(query)));
  return <div className="space-y-6"><PageHeading eyebrow="RECETARIO EXPRESS" title="Un poco de inspiración." description="Las recetas de tu semana, con pasos sencillos y porciones a tu medida." action={<Badge tone="peach">{unique.length} {unique.length === 1 ? "receta" : "recetas"}</Badge>} />
    <label className="search-field"><Search size={19} aria-hidden="true" /><input aria-label="Buscar recetas" placeholder="Busca una receta, ingrediente o preferencia…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
    <p className="text-secondary text-xs" role="status">{query.trim() ? `${visible.length} ${visible.length === 1 ? "resultado" : "resultados"}` : "Busca por nombre, ingrediente o preferencia."}</p>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visible.map((recipe) => <button key={recipe.id} type="button" className="card recipe-tile" onClick={() => setSelected(plan.meals.findIndex((m) => m.recipe.id === recipe.id))}><RecipeArtwork id={recipe.id} image={recipe.image} large /><div className="space-y-3"><div className="flex items-start justify-between gap-3"><h2 className="text-left text-base leading-snug">{recipe.name}</h2><ArrowRight size={18} className="shrink-0" aria-hidden="true" /></div><p className="text-secondary flex items-center gap-1.5 text-xs"><Clock3 size={16} aria-hidden="true" />{recipe.time} min<span className="mx-1">·</span>{recipe.ingredients.length} ingredientes</p></div></button>)}</div>
    {!visible.length && <div className="empty-state"><SearchX size={32} aria-hidden="true" /><h2 className="mt-4 text-lg">No encontramos esa receta</h2><p className="text-secondary mt-2 text-sm">Prueba con otro ingrediente o nombre.</p></div>}
    {selected !== null && <RecipeDialog plan={plan} index={selected} onClose={() => setSelected(null)} />}
  </div>;
}
