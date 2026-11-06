"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/ui/page-heading";
import { RecipeDialog } from "@/features/recipes/recipe-dialog";
import { dayLabel } from "@/lib/domain/format";
import { usePlan } from "./plan-store";
import { BudgetCard } from "./budget-card";
import { MealCard } from "./meal-card";

export function HomeScreen() {
  const { plan, profile } = usePlan();
  const [recipe, setRecipe] = useState<number | null>(null);
  if (!plan) return null;
  const preferences = plan.preferences;
  const cooked = plan.meals.filter((meal) => meal.prepared).length;
  return <div className="space-y-6 md:space-y-8">
    <PageHeading eyebrow="TU PLANIFICACIÓN" title={profile.name ? `Qué bien tenerte, ${profile.name}.` : "¡Tu plan está listo!"} />
    <section className="welcome-banner"><h2 className="text-xl sm:text-2xl">Tu semana, a tu ritmo.</h2><Link href="/semana" className="button button-dark">Ver mi semana<ArrowRight size={18} aria-hidden="true" /></Link></section>
    <div className="home-grid"><div className="space-y-5"><BudgetCard plan={plan} />
      <section className="space-y-3"><h2 className="section-title">Tus preferencias</h2><div className="flex flex-wrap gap-2">{(preferences.goals.length ? preferences.goals : ["Equilibrado general"]).map((goal) => <Badge key={goal}><Check size={14} aria-hidden="true" />{goal}</Badge>)}{preferences.allergies.map((allergy) => <Badge key={allergy} tone="danger">Sin {allergy.toLowerCase()}</Badge>)}{preferences.avoidedItems.map((item) => <Badge key={item} tone="peach">Evitar: {item}</Badge>)}</div></section>
    </div><div className="space-y-5"><section className="space-y-3"><h2 className="section-title">Tus comidas</h2><div className="day-selector">{plan.meals.map((meal, index) => <Link href={`/semana#dia-${index}`} key={meal.id} className="calendar-day" aria-label={`Ver día ${index + 1}: ${dayLabel(plan.createdAt, index)}`}><span>{dayLabel(plan.createdAt, index, true).split(" ")[0]}</span><strong>Día {index + 1}</strong>{meal.prepared ? <Check size={14} aria-label="Preparado" /> : <span className="day-dot" />}</Link>)}</div><p className="text-secondary text-xs">{cooked} de {plan.meals.length} comidas preparadas</p></section>
      <MealCard plan={plan} index={0} featured onOpen={() => setRecipe(0)} />
    </div></div>
    {recipe !== null && <RecipeDialog plan={plan} index={recipe} onClose={() => setRecipe(null)} />}
  </div>;
}
