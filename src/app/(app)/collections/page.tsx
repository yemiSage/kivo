import { IntentLink as Link } from "@/components/IntentLink";
import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { listCollectionsWithCounts } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { NewCollectionButton } from "@/components/CollectionForms";
import { FolderIcon } from "@/components/icons";
import { ContentLayout } from "@/components/ContentLayout";

export const metadata: Metadata = { title: "Vaults" };

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireUser("/collections");
  const collections = await listCollectionsWithCounts(supabase);

  return (
    <>
      <PageHeader
        title="Vaults"
        subtitle="Private or shared spaces for everything worth keeping."
        crumbs={[{ label: "Vaults" }]}
        action={<NewCollectionButton defaultOpen={sp.new === "1"} />}
      />
      {collections.length === 0 ? (
        <EmptyState icon={<FolderIcon size={24} />} title="No vaults yet" body="Create one for yourself or your people." />
      ) : (
        <ContentLayout>
        <ul className="grid grid-cols-1 gap-3 group-data-[layout=grid]/layout:grid-cols-2 sm:group-data-[layout=grid]/layout:grid-cols-3 lg:group-data-[layout=grid]/layout:grid-cols-4">
          {collections.map((c, i) => (
            <li key={c.id} className="animate-rise" style={{ animationDelay: `${i * 30}ms` }}>
              <Link
                href={`/collections/${c.id}`}
                className="group block rounded-2xl border bg-card p-2 group-data-[layout=list]/layout:flex group-data-[layout=list]/layout:items-center group-data-[layout=list]/layout:gap-3"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary group-data-[layout=list]/layout:aspect-square group-data-[layout=list]/layout:size-16 group-data-[layout=list]/layout:shrink-0 sm:group-data-[layout=list]/layout:size-20">
                  {c.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.cover} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-muted-foreground">
                      <FolderIcon size={36} />
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 px-1.5 pb-1.5 pt-3 group-data-[layout=list]/layout:min-w-0 group-data-[layout=list]/layout:flex-1 group-data-[layout=list]/layout:p-0">
                  <p className="truncate text-[13px] font-medium md:text-[15px]">{c.name}</p>
                  <span className="shrink-0 rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">{c.item_count}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        </ContentLayout>
      )}
    </>
  );
}
