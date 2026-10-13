import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { listItems, parseKind } from "@/lib/data";
import type { Collection } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { KindFilter } from "@/components/KindFilter";
import { ItemGrid } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { CollectionMenu } from "@/components/CollectionForms";
import { FolderIcon } from "@/components/icons";

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const kind = parseKind(sp.kind);
  const { supabase, user } = await requireUser(`/collections/${id}`);

  const [{ data: collection }, items] = await Promise.all([
    supabase.from("collections").select("*").eq("id", id).maybeSingle<Collection>(),
    listItems(supabase, { collectionId: id, kind }),
  ]);
  if (!collection) notFound();

  return (
    <>
      <PageHeader
        title={collection.name}
        subtitle={`${items.length} ${items.length === 1 ? "item" : "items"}`}
        back="/collections"
        crumbs={[{ label: "Vaults", href: "/collections" }, { label: collection.name }]}
        action={collection.user_id === user.id ? <CollectionMenu collection={collection} /> : undefined}
      />
      <KindFilter basePath={`/collections/${id}`} active={kind} />
      {items.length ? (
        <ItemGrid items={items} />
      ) : (
        <EmptyState
          icon={<FolderIcon size={24} />}
          title="Nothing here yet"
          body="Save directly to this vault, or move existing items here from their detail page."
          cta={{ href: "/save", label: "Save" }}
        />
      )}
    </>
  );
}
