import { ChefHat, Clock3, Users } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

import { quantity } from "@/lib/domain/format";
import type { MealPlan } from "@/lib/domain/types";
import { RecipeArtwork } from "./recipe-artwork";

export function RecipeDialog({ plan, index, onClose }: { plan: MealPlan; index: number; onClose: () => void }) {
  const recipe = plan.meals[index].recipe;
  return <Modal title="Tu receta, paso a paso" onClose={onClose}>
    <div className="space-y-6"><RecipeArtwork id={recipe.id} image={recipe.image} large /><div><p className="eyebrow mb-2">DÍA {index + 1} · COMIDA PRINCIPAL</p><h2 className="text-2xl leading-tight">{recipe.name}</h2><div className="text-secondary mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs"><span className="inline-flex items-center gap-1.5"><Clock3 size={15} aria-hidden="true" />{recipe.time} minutos</span><span className="inline-flex items-center gap-1.5"><Users size={15} aria-hidden="true" />{plan.preferences.people} {plan.preferences.people === 1 ? "porción" : "porciones"}</span></div></div>
      <section><h3 className="mb-3 text-base">Ingredientes</h3><ul className="divide-y divide-[var(--border)]">{recipe.ingredients.map((ingredient) => <li key={ingredient.name} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0 text-sm"><span>{ingredient.name}</span><strong className="shrink-0 text-xs">{quantity(ingredient.qty * plan.preferences.people / recipe.servings, ingredient.unit)}</strong></li>)}</ul></section>
      <section><h3 className="mb-4 flex items-center gap-2 text-base"><ChefHat size={20} aria-hidden="true" />Preparación</h3><ol className="space-y-4">{recipe.steps.map((step, i) => <li key={step} className="flex items-start gap-3 text-sm leading-relaxed"><span className="step-number">{i + 1}</span><span className="pt-1">{step}</span></li>)}</ol></section>
      <div className="flex flex-wrap gap-2">{recipe.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}{recipe.allergens.map((allergen) => <Badge key={allergen} tone="danger">Contiene {allergen.toLowerCase()}</Badge>)}</div>
    </div>
  </Modal>;
}
