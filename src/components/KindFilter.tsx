import Link from "next/link";
import type { ItemKind } from "@/lib/types";
import { ITEM_KINDS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { KIND_META } from "./ItemCard";
import { GridIcon } from "./icons";

/** Segmented filter (like the Calendar / Board switcher in the reference). Plain links, works without JS. */
export function KindFilter({ basePath, active, extra = {} }: { basePath: string; active: ItemKind | null; extra?: Record<string, string> }) {
  const href = (kind: ItemKind | null) => {
    const p = new URLSearchParams(extra);
    if (kind) p.set("kind", kind);
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const items: { kind: ItemKind | null; label: string; Icon: (p: { size?: number }) => React.ReactNode }[] = [
    { kind: null, label: "All", Icon: GridIcon },
    ...ITEM_KINDS.map((k) => ({ kind: k, label: KIND_META[k].plural, Icon: KIND_META[k].Icon })),
  ];

  return (
    <nav aria-label="Filter by type" className="no-scrollbar -mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="inline-flex h-10 items-center gap-0.5 rounded-xl border bg-secondary p-1">
        {items.map(({ kind, label, Icon }) => {
          const on = active === kind;
          return (
            <Link
              key={label}
              href={href(kind)}
              scroll={false}
              aria-current={on ? "true" : undefined}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors",
                on ? "bg-background font-medium text-foreground shadow-[0_1px_2px_rgb(40_40_30/0.08)]" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
