"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, House, NotebookText, ShoppingBasket, UserRound } from "lucide-react";

export const navigation = [{ href: "/", label: "Inicio", icon: House }, { href: "/semana", label: "Semana", icon: CalendarDays }, { href: "/compras", label: "Compras", icon: ShoppingBasket }, { href: "/recetas", label: "Recetas", icon: NotebookText }, { href: "/perfil", label: "Perfil", icon: UserRound }];

export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label={mobile ? "Navegación principal móvil" : "Navegación principal"} className={mobile ? "bottom-nav" : "side-nav"}>
    {navigation.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${pathname === href ? "active" : ""}`} aria-current={pathname === href ? "page" : undefined}><Icon size={20} strokeWidth={pathname === href ? 2.2 : 1.8} aria-hidden="true" /><span>{label}</span></Link>)}
  </nav>;
}
