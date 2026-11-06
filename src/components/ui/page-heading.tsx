import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <header className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1 space-y-2"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{description && <p className="text-secondary max-w-xl text-sm leading-relaxed">{description}</p>}</div>{action}</header>;
}
