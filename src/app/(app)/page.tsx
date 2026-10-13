import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { listItems, parseKind } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { KindFilter } from "@/components/KindFilter";
import { ItemGrid, KIND_META } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { BookmarkIcon, FolderIcon, PlusIcon, SparkleIcon } from "@/components/icons";

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const kind = parseKind(sp.kind);
  const { supabase } = await requireUser("/");
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();

  const [items, total, week, collections] = await Promise.all([
    listItems(supabase, { kind }),
    supabase.from("items").select("id", { count: "exact", head: true }),
    supabase.from("items").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("collections").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Saved", value: total.count ?? 0, Icon: BookmarkIcon },
    { label: "This week", value: week.count ?? 0, Icon: SparkleIcon },
    { label: "Vaults", value: collections.count ?? 0, Icon: FolderIcon, href: "/collections" },
  ];

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

      {(total.count ?? 0) > 0 && (
        <section aria-label="Overview" className="mb-6 grid grid-cols-3 divide-x rounded-2xl border bg-card">
          {stats.map(({ label, value, Icon, href }) => {
            const body = (
              <>
                <span className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground md:text-sm">
                  <Icon size={16} className="hidden sm:block" /> {label}
                </span>
                <span className="mt-2 block text-2xl font-semibold tracking-tight tabular-nums md:text-[28px]">{value}</span>
              </>
            );
            return href ? (
              <Link key={label} href={href} className="p-4 transition hover:bg-secondary/60 first:rounded-l-2xl last:rounded-r-2xl md:p-5">
                {body}
              </Link>
            ) : (
              <div key={label} className="p-4 md:p-5">
                {body}
              </div>
            );
          })}
        </section>
      )}

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
