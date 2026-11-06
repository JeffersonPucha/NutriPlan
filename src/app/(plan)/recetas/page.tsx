import type { Metadata } from "next";
import { RecipesScreen } from "@/features/recipes/recipes-screen";

// El plan se recupera en el navegador durante esta primera etapa.
export const instant = false;

export const metadata: Metadata = { title: "Recetas" };

export default function Page() {
  return <RecipesScreen />;
}
