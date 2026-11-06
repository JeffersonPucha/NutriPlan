import type { Metadata } from "next";
import { ShoppingScreen } from "@/features/shopping/shopping-screen";

// El plan se recupera en el navegador durante esta primera etapa.
export const instant = false;

export const metadata: Metadata = { title: "Compras" };

export default function Page() {
  return <ShoppingScreen />;
}
