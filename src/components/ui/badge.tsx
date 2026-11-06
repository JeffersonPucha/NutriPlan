import type { ReactNode } from "react";

export function Badge({ children, tone = "green" }: { children: ReactNode; tone?: "green" | "peach" | "blue" | "warning" | "danger" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
