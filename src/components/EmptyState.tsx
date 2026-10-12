import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function EmptyState({ icon, title, body, cta }: { icon: ReactNode; title: string; body: string; cta?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary text-foreground">{icon}</div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
      {cta && (
        <Button asChild className="mt-5">
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      )}
    </div>
  );
}
