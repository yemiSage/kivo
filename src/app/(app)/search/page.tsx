import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { listTopTags, parseKind, searchItems } from "@/lib/data";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { KindFilter } from "@/components/KindFilter";
import { ItemGrid } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { SearchBox } from "@/components/SearchBox";
import { HashIcon, SearchIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const tag = typeof sp.tag === "string" ? sp.tag : null;
  const kind = parseKind(sp.kind);
  const { supabase } = await requireUser("/search");
  const [items, tags] = await Promise.all([searchItems(supabase, q, kind, tag), listTopTags(supabase)]);
  const searching = Boolean(q.trim() || tag);

  const extra: Record<string, string> = {};
  if (q) extra.q = q;
  if (tag) extra.tag = tag;

  return (
    <>
      <PageHeader title="Search" subtitle="Find anything by title, note, tag or site." crumbs={[{ label: "Search" }]} />
      <SearchBox initial={q} />
      {tags.length > 0 && (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {tags.map((t) => (
            <Link
              key={t}
              href={tag === t ? "/search" : `/search?tag=${encodeURIComponent(t)}`}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-sm transition",
                tag === t ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground",
              )}
            >
              <HashIcon size={14} />
              {t}
            </Link>
          ))}
        </div>
      )}
      <KindFilter basePath="/search" active={kind} extra={extra} />
      {items.length ? (
        <>
          <p className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {searching ? `${items.length} result${items.length === 1 ? "" : "s"}` : "Recently saved"}
          </p>
          <ItemGrid items={items} />
        </>
      ) : (
        <EmptyState
          icon={<SearchIcon size={24} />}
          title={searching ? "No matches" : "Nothing saved yet"}
          body={searching ? "Try another word or tag, or clear the type filter." : "Saved items become searchable by title, notes, tags and site."}
        />
      )}
    </>
  );
}
