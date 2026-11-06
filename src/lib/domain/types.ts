export interface NamedOption { id: string; nombre: string; slug: string }
export interface StoreOption extends NamedOption { activo: boolean }
export interface ProductOption {
  id: string; nombre: string; categoria: string; unidad: string; activo: boolean;
  precios: { precio: string; disponibilidad: boolean; actualizadoEn: string; store: NamedOption }[];
}
export interface Catalogs { stores: StoreOption[]; preferences: NamedOption[]; allergies: NamedOption[]; products: ProductOption[] }
export interface Preferences {
  storeId: string | null; market: string | null;
  budget: number; days: number; people: number;
  preferenceIds: string[]; allergyIds: string[];
  goals: string[]; allergies: string[]; avoidedItems: string[]; hasNoAllergies: boolean;
}
export interface Ingredient { productId: string; name: string; qty: number; unit: string; category: string }
export interface Recipe {
  id: string; name: string; description: string; time: number; servings: number; image: string | null;
  tags: string[]; allergens: string[]; ingredients: Ingredient[]; steps: string[];
}
export interface ShoppingItem extends Ingredient { id: string; key: string; cost: number; checked: boolean }
export interface PlannedMeal { id: string; day: number; type: string; order: number; prepared: boolean; cost: number; recipe: Recipe }
export interface MealPlan {
  id: string; createdAt: string; status: string; preferences: Preferences;
  store: StoreOption; meals: PlannedMeal[]; shoppingListId: string | null; shopping: ShoppingItem[]; total: number;
}
export type Theme = "light" | "dark";
export interface Profile { id: string; name: string; email: string }
export type PlanStrategy = "standard" | "economical" | "reduce-days";
export interface PlanInput {
  storeId: string; budget: number; days: number; people: number;
  preferenceIds: string[]; allergyIds: string[]; excludedIngredients: string[];
  strategy: PlanStrategy; requestKey?: string;
}
