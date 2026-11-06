"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null); const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onPrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPrompt); };
    const onInstalled = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt); window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  if (installed) return <p className="text-green text-xs">NutriPlan ya está instalado.</p>;
  if (!prompt) return <p className="text-secondary text-xs leading-relaxed">En el menú de tu navegador, elige «Instalar aplicación» o «Añadir a pantalla de inicio» cuando esté disponible.</p>;
  return <Button variant="secondary" onClick={async () => { await prompt.prompt(); const choice = await prompt.userChoice; if (choice.outcome === "accepted") setInstalled(true); setPrompt(null); }}><Download size={17} aria-hidden="true" />Instalar NutriPlan</Button>;
}
