import { ArrowRight, Check, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RecipeArtwork } from "@/features/recipes/recipe-artwork";
import { money, dayLabel } from "@/lib/domain/format";

import type { MealPlan } from "@/lib/domain/types";
import { planActions, usePlan } from "./plan-store";

export function MealCard({ plan, index, onOpen, featured = false }: { plan: MealPlan; index: number; onOpen: () => void; featured?: boolean }) {
  const { pendingIds } = usePlan();
  const meal = plan.meals[index]; const recipe = meal.recipe;
  return <article className={`card meal-card ${featured ? "meal-card-featured" : ""}`} id={featured ? undefined : `dia-${index}`}>
    {featured && <RecipeArtwork id={recipe.id} image={recipe.image} large />}
    <div className="flex items-start gap-3">{!featured && <RecipeArtwork id={recipe.id} image={recipe.image} />}<div className="min-w-0 flex-1"><div className="mb-2 flex items-center justify-between gap-2"><span className="eyebrow">Día {index + 1}{!featured && <span> · {dayLabel(plan.createdAt, index, true)}</span>}</span><span className="text-green shrink-0 text-sm font-bold" aria-label={`Costo estimado: ${money(meal.cost)}`}>{money(meal.cost)}</span></div><h3 className={featured ? "text-xl leading-snug" : "text-base leading-snug"}>{recipe.name}</h3><p className="text-secondary mt-2 flex items-center gap-1.5 text-xs"><Clock3 size={16} aria-hidden="true" />{recipe.time} min<span className="mx-1">·</span>{plan.preferences.people} {plan.preferences.people === 1 ? "porción" : "porciones"}</p></div></div>
    {featured && <div className="flex flex-wrap gap-2">{recipe.tags.slice(0, 2).map((tag) => <Badge key={tag} tone="peach">{tag}</Badge>)}</div>}
    <div className="meal-card-actions"><Button variant="secondary" onClick={onOpen}>Ver receta<ArrowRight size={18} aria-hidden="true" /></Button><Button variant="ghost" disabled={pendingIds.includes(meal.id)} aria-pressed={meal.prepared} aria-label={`${meal.prepared ? "Desmarcar" : "Marcar"} comida del día ${index + 1} como preparada`} onClick={() => planActions.toggleCooked(index)}><Check size={18} aria-hidden="true" />{pendingIds.includes(meal.id) ? "Guardando…" : meal.prepared ? "Preparada" : "Marcar preparada"}</Button></div>
  </article>;
}
