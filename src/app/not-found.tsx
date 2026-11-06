import Link from "next/link";
import { Leaf } from "lucide-react";

export default function NotFound() {
  return <main className="loading-screen px-5 text-center"><Leaf size={35} aria-hidden="true" /><h1>Este camino no está en el plan.</h1><p className="text-secondary">La página que buscas no existe.</p><Link href="/" className="button button-primary">Volver al inicio</Link></main>;
}
