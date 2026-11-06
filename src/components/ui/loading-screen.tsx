import { Leaf } from "lucide-react";

export function LoadingScreen() {
  return <div className="loading-screen" role="status"><span className="brand-icon"><Leaf size={28} aria-hidden="true" /></span><p className="font-semibold">Preparando tu planificación…</p></div>;
}
