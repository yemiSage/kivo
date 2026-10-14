import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { listItems, parseKind } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { KindFilter } from "@/components/KindFilter";
import { ItemGrid, KIND_META } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, PlusIcon } from "@/components/icons";

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const kind = parseKind(sp.kind);
  const { supabase } = await requireUser("/");
  const items = await listItems(supabase, { kind });

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

      <KindFilter basePath="/" active={kind} />

      {items.length ? (
        <ItemGrid items={items} />
      ) : kind ? (
        (() => {
          const { Icon, plural } = KIND_META[kind];
          return (
            <EmptyState
              icon={<Icon size={24} />}
              title={`No ${plural.toLowerCase()} yet`}
              body="Saves are sorted by type automatically."
              cta={{ href: "/", label: "Show everything" }}
            />
          );
        })()
      ) : (
        <EmptyState
          icon={<BookmarkIcon size={24} />}
          title="Save your first link"
          body="Paste a link from Instagram, TikTok, X, Pinterest or any website, or upload an image."
          cta={{ href: "/save", label: "Save" }}
        />
      )}
    </>
  );
}
