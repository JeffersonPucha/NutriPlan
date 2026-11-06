import type { Metadata } from "next";
import { ProfileScreen } from "@/features/profile/profile-screen";

// El plan se recupera en el navegador durante esta primera etapa.
export const instant = false;

export const metadata: Metadata = { title: "Perfil" };

export default function Page() {
  return <ProfileScreen />;
}
