"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="empty-state"><h1>No pudimos abrir esta pantalla.</h1><p className="my-4">Puedes intentarlo de nuevo. Tu planificación guardada permanece en PostgreSQL.</p><Button onClick={reset}><RefreshCw size={17} aria-hidden="true" />Volver a intentar</Button></div>;
}
