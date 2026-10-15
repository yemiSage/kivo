import Link from "next/link";
import { Suspense } from "react";
import { requireUser } from "@/lib/supabase/server";
import { listItems, parseKind } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { KindFilter } from "@/components/KindFilter";
import { ItemGrid, KIND_META } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, HashIcon, PlusIcon, XIcon } from "@/components/icons";
import { GridSkeleton } from "@/components/Skeletons";
import type { ItemKind } from "@/lib/types";

async function LibraryItems({ kind, tag }: { kind: ItemKind | null; tag: string | null }) {
  const { supabase } = await requireUser("/");
  const items = await listItems(supabase, { kind, tag });
  if (items.length) return <ItemGrid items={items} />;
  if (tag) return <EmptyState icon={<HashIcon size={24} />} title={`No items tagged #${tag}`} body="Try another type or clear the tag filter." cta={{ href: "/", label: "Clear tag" }} />;
  if (kind) {
    const { Icon, plural } = KIND_META[kind];
    return <EmptyState icon={<Icon size={24} />} title={`No ${plural.toLowerCase()} yet`} body="Saves are sorted by type automatically." cta={{ href: "/", label: "Show everything" }} />;
  }
  return <EmptyState icon={<BookmarkIcon size={24} />} title="Save your first link" body="Paste a link from Instagram, TikTok, X, Pinterest or any website, or upload an image." cta={{ href: "/save", label: "Save" }} />;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const kind = parseKind(sp.kind);
  const tag = typeof sp.tag === "string" ? sp.tag.trim().slice(0, 32) || null : null;

  return (
    <>
      <PageHeader
        title="Library"
        subtitle="Everything you’ve saved, newest first."
        crumbs={[{ label: "Library" }]}
        action={
          <Button asChild className="hidden md:inline-flex">
            <Link href="/save">
              <PlusIcon size={18} /> Save
            </Link>
          </Button>
        }
      />

      {tag && (
        <div className="mb-3 flex min-w-0 items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs">
          <HashIcon size={16} />
          <span className="min-w-0 flex-1 truncate">{tag}</span>
          <Link href={kind ? `/?kind=${kind}` : "/"} aria-label="Clear tag filter" className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-background focus-visible:ring-2 focus-visible:ring-ring">
            <XIcon size={16} />
          </Link>
        </div>
      )}
      <KindFilter basePath="/" active={kind} extra={tag ? { tag } : {}} />

      <Suspense key={`${kind ?? "all"}:${tag ?? ""}`} fallback={<GridSkeleton />}>
        <LibraryItems kind={kind} tag={tag} />
      </Suspense>
    </>
  );
}
