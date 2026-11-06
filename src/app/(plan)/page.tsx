import type { Metadata } from "next";
import { HomeScreen } from "@/features/plan/home-screen";

// El plan se recupera en el navegador durante esta primera etapa.
export const instant = false;

export const metadata: Metadata = { title: "Inicio" };

export default function Page() {
  return <HomeScreen />;
}
