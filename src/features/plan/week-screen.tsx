"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { RecipeDialog } from "@/features/recipes/recipe-dialog";
import { dayLabel } from "@/lib/domain/format";
import { MealCard } from "./meal-card";
import { usePlan } from "./plan-store";

export function WeekScreen() {
  const { plan } = usePlan();
  const [selected, setSelected] = useState(0);
  const [recipe, setRecipe] = useState<number | null>(null);
  const planId = plan?.id; const mealCount = plan?.meals.length ?? 0;
  useEffect(() => {
    if (!planId) return;
    const selectFromHash = () => {
      const match = /^#dia-(\d+)$/.exec(window.location.hash);
      if (match && Number(match[1]) < mealCount) {
        const index = Number(match[1]);
        setSelected(index);
        document.getElementById(`dia-${index}`)?.scrollIntoView({ behavior: "instant", block: "start" });
      }
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    const intersections = new Map<Element, IntersectionObserverEntry>();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => intersections.set(entry.target, entry));
      const visible = [...intersections.values()].filter((entry) => entry.isIntersecting).sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top);
      if (visible[0]) setSelected((previous) => visible.some((entry) => entry.target.id === `dia-${previous}`) ? previous : Number(visible[0].target.id.slice(4)));
    }, { rootMargin: "-180px 0px 0px 0px", threshold: 0 });
    document.querySelectorAll(".meal-card[id]").forEach((card) => observer.observe(card));
    return () => { observer.disconnect(); window.removeEventListener("hashchange", selectFromHash); };
  }, [planId, mealCount]);
  if (!plan) return null;
  return <div className="week-screen space-y-6"><PageHeading eyebrow="PLAN SEMANAL" title="Tu semana, resuelta." description={`${plan.preferences.days} comidas principales para ${plan.preferences.people} ${plan.preferences.people === 1 ? "persona" : "personas"}.`} />
    <div className="day-selector week-days" role="group" aria-label="Ir a un día del plan">{plan.meals.map((meal, index) => <button key={meal.id} type="button" className={`calendar-day ${selected === index ? "active" : ""}`} aria-pressed={selected === index} aria-controls={`dia-${index}`} aria-label={`Día ${index + 1}: ${dayLabel(plan.createdAt, index)}`} onClick={() => {
      document.getElementById(`dia-${index}`)?.scrollIntoView({ behavior: "instant", block: "start" });
      setSelected(index);
    }}><span>{dayLabel(plan.createdAt, index, true).split(" ")[0]}</span><strong>Día {index + 1}</strong>{meal.prepared ? <Check size={14} aria-label="Preparado" /> : <span className="day-dot" />}</button>)}</div>
    <div className="grid gap-4 md:grid-cols-2">{plan.meals.map((meal, index) => <MealCard key={meal.id} plan={plan} index={index} onOpen={() => setRecipe(index)} />)}</div>
    {recipe !== null && <RecipeDialog plan={plan} index={recipe} onClose={() => setRecipe(null)} />}
  </div>;
}
