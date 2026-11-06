import { Beef, Carrot, Fish, Leaf, Salad, Soup, Utensils, Wheat } from "lucide-react";
import Image from "next/image";

const recipeIcons = { pollo_quinoa: Utensils, lentejas_arroz: Soup, pasta_carne: Wheat, tortilla_vegetales: Carrot,
  pescado_papas: Fish, cerdo_arroz: Utensils, garbanzos_aguacate: Salad, arroz_pollo: Utensils,
  pasta_garbanzos: Wheat, bowl_carne_frijol: Beef, crema_verduras: Soup, pollo_ensalada: Leaf };

export function RecipeArtwork({ id, image, large = false }: { id: string; image?: string | null; large?: boolean }) {
  const Icon = recipeIcons[id as keyof typeof recipeIcons] ?? Salad;
  if (image) return <div className={`recipe-artwork ${large ? "recipe-artwork-large" : ""}`} aria-hidden="true"><Image src={image} alt="" width={640} height={360} unoptimized className="h-full w-full object-cover" /></div>;
  return <div className={`recipe-artwork ${large ? "recipe-artwork-large" : ""}`} aria-hidden="true"><div className="artwork-ring"><Icon size={large ? 62 : 30} strokeWidth={1.45} /></div></div>;
}
