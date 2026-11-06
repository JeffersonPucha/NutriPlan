import { AppShell } from "@/components/layout/app-shell";

export const instant = false;

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
