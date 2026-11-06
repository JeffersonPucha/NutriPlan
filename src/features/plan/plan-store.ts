"use client";
import { useSyncExternalStore } from "react";
import { defaultPreferences } from "@/lib/domain/preferences";
import { api } from "@/lib/api/client";
import type { Catalogs, MealPlan, Preferences, Profile, Theme } from "@/lib/domain/types";

interface Snapshot {
  hydrated: boolean; loading: boolean; error: string | null; mutationError: string | null; message: string | null;
  plan: MealPlan | null; preferences: Preferences; profile: Profile; catalogs: Catalogs; theme: Theme;
  catalogLoading: boolean; catalogError: string | null; pendingIds: string[];
}
const initial: Snapshot = { hydrated: false, loading: true, error: null, mutationError: null, message: null, plan: null,
  preferences: defaultPreferences(), profile: { id: "", name: "", email: "" }, theme: "light", pendingIds: [],
  catalogs: { stores: [], preferences: [], allergies: [], products: [] }, catalogLoading: true, catalogError: null };
let snapshot = initial;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const update = (patch: Partial<Snapshot>) => { snapshot = { ...snapshot, ...patch }; listeners.forEach((listener) => listener()); };
let initializing: Promise<void> | null = null;
let catalogRequest: Promise<void> | null = null;
const THEME_KEY = "nutriplan.theme";
export async function loadCatalogs() {
  if (catalogRequest) return catalogRequest;
  update({ catalogLoading: true, catalogError: null });
  catalogRequest = (async () => {
    try {
      const [stores, preferences, allergies, products] = await Promise.all([
        api<{ stores: Catalogs["stores"] }>("/api/stores"), api<{ preferences: Catalogs["preferences"] }>("/api/preferences"),
        api<{ allergies: Catalogs["allergies"] }>("/api/allergies"), api<{ products: Catalogs["products"] }>("/api/products"),
      ]);
      update({ catalogs: { stores: stores.stores, preferences: preferences.preferences, allergies: allergies.allergies, products: products.products }, catalogLoading: false });
    } catch (e) { update({ catalogLoading: false, catalogError: (e as Error).message }); }
    finally { catalogRequest = null; }
  })();
  return catalogRequest;
}
export async function refreshPlan() {
  update({ loading: true, error: null });
  try {
    const [result, profile] = await Promise.all([api<{ plan: MealPlan | null }>("/api/plans"), api<{ profile: Profile; preferences: Preferences }>("/api/profile")]);
    update({ plan: result.plan, preferences: result.plan?.preferences ?? profile.preferences, profile: profile.profile, hydrated: true, loading: false });
  } catch (e) { update({ hydrated: true, loading: false, error: (e as Error).message }); }
}
export function hydratePlanStore() {
  if (initializing) return initializing;
  try { update({ theme: window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light" }); } catch { /* El tema visual no impide acceder al servidor. */ }
  initializing = Promise.all([refreshPlan(), loadCatalogs()]).then(() => {});
  return initializing;
}
export function syncBrowserState(event: StorageEvent) {
  if (event.key === THEME_KEY) update({ theme: event.newValue === "dark" ? "dark" : "light" });
}
async function mutate(id: string, operation: () => Promise<void>) {
  if (snapshot.pendingIds.includes(id)) return;
  update({ pendingIds: [...snapshot.pendingIds, id], mutationError: null });
  try { await operation(); } catch (e) { update({ mutationError: (e as Error).message }); }
  finally { update({ pendingIds: snapshot.pendingIds.filter((key) => key !== id) }); }
}
export const planActions = {
  acceptPlan(plan: MealPlan) { update({ plan, preferences: plan.preferences, error: null, message: "Tu planificación está guardada en PostgreSQL." }); },
  async toggleCooked(index: number) {
    const plan = snapshot.plan; const meal = plan?.meals[index]; if (!plan || !meal) return;
    await mutate(meal.id, async () => {
      const result = await api<{ meal: { id: string; prepared: boolean } }>(`/api/plan-meals/${meal.id}`, { method: "PATCH", body: JSON.stringify({ prepared: !meal.prepared }) });
      if (snapshot.plan?.id === plan.id) update({ plan: { ...snapshot.plan, meals: snapshot.plan.meals.map((m) => m.id === meal.id ? { ...m, prepared: result.meal.prepared } : m) } });
    });
  },
  async toggleShopping(id: string) {
    const plan = snapshot.plan; const item = plan?.shopping.find((i) => i.id === id); if (!plan || !item) return;
    await mutate(id, async () => {
      const result = await api<{ item: { purchased: boolean } }>(`/api/shopping-items/${id}`, { method: "PATCH", body: JSON.stringify({ purchased: !item.checked }) });
      if (snapshot.plan?.id === plan.id) update({ plan: { ...snapshot.plan, shopping: snapshot.plan.shopping.map((i) => i.id === id ? { ...i, checked: result.item.purchased } : i) } });
    });
  },
  async setName(name: string) { await mutate("profile", async () => { const result = await api<{ profile: Profile }>("/api/profile", { method: "PATCH", body: JSON.stringify({ name: name.trim() }) }); update({ profile: result.profile, message: "Perfil guardado en PostgreSQL." }); }); },
  toggleTheme() {
    const theme = snapshot.theme === "dark" ? "light" : "dark"; update({ theme });
    try { window.localStorage.setItem(THEME_KEY, theme); } catch { /* Preferencia visual no crítica. */ }
  },
  clearMessage() { update({ message: null }); }, dismissMutationError() { update({ mutationError: null }); },
};
export function usePlan() { return useSyncExternalStore(subscribe, () => snapshot, () => initial); }
