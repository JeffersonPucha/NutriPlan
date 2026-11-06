import type { Metadata, Viewport } from "next";
import { AppProvider } from "@/components/layout/app-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "NutriPlan · Tu semana, a tu medida", template: "%s · NutriPlan" },
  description: "Planifica tus comidas, organiza tus compras y cuida tu presupuesto, un hábito a la vez.",
  applicationName: "NutriPlan",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "NutriPlan" },
  icons: { icon: "/icons/icon.svg", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#8FC9A3" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body><AppProvider>{children}</AppProvider></body></html>;
}
