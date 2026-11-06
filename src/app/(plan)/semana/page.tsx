import type { Metadata } from "next";
import { WeekScreen } from "@/features/plan/week-screen";

// El plan se recupera en el navegador durante esta primera etapa.
export const instant = false;

export const metadata: Metadata = { title: "Semana" };

export default function Page() {
  return <WeekScreen />;
}
