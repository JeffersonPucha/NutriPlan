import catalog from "./data/recipes.json";
import { goals, allergies } from "./data/options";

export const slug = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const canonicalPreference = (value: string) => value === "Bajo en carbos" ? "Bajo en carbohidratos" : value;
const productAliases: Record<string, string> = { "Pechuga de pollo": "Pollo", "Huevo": "Huevos" };
export const canonicalProduct = (value: string) => productAliases[value] ?? value;
export const preferenceId = (name: string) => `pref_${slug(canonicalPreference(name))}`;
export const allergyId = (name: string) => `allergy_${slug(name)}`;
export const productId = (name: string) => `product_${slug(canonicalProduct(name))}`;

export const storeSeed = [
  { id: "store_supermaxi", nombre: "Supermaxi", slug: "supermaxi", factor: 1.08, priceOffsetCents: 3 },
  { id: "store_coral", nombre: "Coral Hipermercados", slug: "coral-hipermercados", factor: .96, priceOffsetCents: 2 },
  { id: "store_gran_aki", nombre: "Gran Akí", slug: "gran-aki", factor: .91, priceOffsetCents: 0 },
  { id: "store_tia", nombre: "Almacenes Tía", slug: "almacenes-tia", factor: .94, priceOffsetCents: 1 },
];
export const preferenceSeed = goals.map(canonicalPreference);
export const allergySeed = allergies;
export const recipeSeed = catalog;

export type SeedUnit = "KG" | "L" | "UNIDAD";
export interface SeedProduct { id: string; nombre: string; categoria: string; unidad: SeedUnit; precioBase: number }

const base: [string, string, SeedUnit, number][] = [
  ["Arroz", "Granos y despensa", "KG", 1.80], ["Pollo", "Carnes y proteínas", "KG", 6.80],
  ["Huevos", "Lácteos y huevos", "UNIDAD", .25], ["Tomate", "Frutas y verduras", "KG", 1.50],
  ["Cebolla", "Frutas y verduras", "KG", 1.20], ["Brócoli", "Frutas y verduras", "KG", 2.40],
  ["Leche", "Lácteos y huevos", "L", 1.15], ["Queso", "Lácteos y huevos", "KG", 7.50],
  ["Avena", "Granos y despensa", "KG", 2.10], ["Pasta", "Granos y despensa", "KG", 2.20],
  ["Lentejas", "Granos y despensa", "KG", 2.50], ["Atún", "Carnes y proteínas", "UNIDAD", 1.65],
  ["Aguacate", "Frutas y verduras", "UNIDAD", .85], ["Papa", "Frutas y verduras", "KG", 1.10],
  ["Zanahoria", "Frutas y verduras", "KG", 1.20],
];
const products = new Map<string, SeedProduct>(base.map(([nombre, categoria, unidad, precioBase]) => [nombre, { id: productId(nombre), nombre, categoria, unidad, precioBase }]));
for (const recipe of recipeSeed) for (const ingredient of recipe.ingredients) {
  const nombre = canonicalProduct(ingredient.name);
  if (!products.has(nombre)) products.set(nombre, { id: productId(nombre), nombre, categoria: ingredient.category,
    unidad: ingredient.unit === "g" ? "KG" : "UNIDAD", precioBase: Math.round(ingredient.cost / (ingredient.unit === "g" ? ingredient.qty / 1000 : ingredient.qty) * 100) / 100 });
}
export const productSeed = [...products.values()];
// El pequeño ajuste hace distinguibles los cuatro precios incluso por unidad de huevo.
export function storePriceCents(product: SeedProduct, store: typeof storeSeed[number]) {
  return Math.round((product.precioBase * store.factor + Number.EPSILON) * 100) + store.priceOffsetCents;
}
export function ingredientQuantity(quantity: number, unit: string) { return unit === "g" ? quantity / 1000 : quantity; }
export const DEMO_USER_ID = "demo_nutriplan_user";
export const DEMO_PLAN_ID = "demo_nutriplan_plan";
export const DEMO_LIST_ID = "demo_nutriplan_shopping_list";
export const demoRecipeIds = ["arroz_pollo", "lentejas_arroz", "pollo_ensalada"];
