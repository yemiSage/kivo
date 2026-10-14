import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getItem, listCollections } from "@/lib/data";
import { hostLabel } from "@/lib/url";
import { PageHeader } from "@/components/PageHeader";
import { ItemThumb, KIND_META, sourceLabel } from "@/components/ItemCard";
import { ItemEditor } from "@/components/ItemEditor";
import { ImagePreview } from "@/components/ImagePreview";
import { Button } from "@/components/ui/button";
import { ExternalIcon } from "@/components/icons";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireUser(`/item/${id}`);
  const [item, collections] = await Promise.all([getItem(supabase, id), listCollections(supabase)]);
  if (!item) notFound();

  const { Icon, label } = KIND_META[item.kind];
  const title = item.title || hostLabel(item.url) || "Untitled";
  const saved = new Date(item.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  return (
    <>
      <PageHeader
        title={title}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1">
              <Icon size={15} /> {label}
            </span>
            <span aria-hidden>·</span> {sourceLabel(item)}
            {item.author && (
              <>
                <span aria-hidden>·</span> {item.author}
              </>
            )}
            <span aria-hidden>·</span> Saved {saved}
          </span>
        }
        back="/"
        crumbs={[{ label: "Library", href: "/" }, { label: sourceLabel(item) }]}
        action={
          item.url && (
            <Button asChild className="hidden md:inline-flex">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                Open original <ExternalIcon size={18} />
              </a>
            </Button>
          )
        }
      />
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6">
          <div className="min-w-0 overflow-hidden rounded-2xl border bg-secondary">
            {item.image ? (
              <ImagePreview
                itemId={item.id}
                src={item.image}
                alt={item.title ?? ""}
                initialX={item.image_position_x ?? 50}
                initialY={item.image_position_y ?? 50}
              />
            ) : (
              <div className="aspect-video">
                <ItemThumb item={item} />
              </div>
            )}
          </div>
          {item.url && (
            <Button asChild variant="outline" className="w-full md:hidden">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                Open original <ExternalIcon size={18} />
              </a>
            </Button>
          )}
          {item.description && <p className="break-words whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">{item.description}</p>}
        </div>
        <div className="w-full min-w-0 overflow-hidden rounded-2xl border bg-card p-4 md:p-6">
          <ItemEditor item={item} collections={collections} />
        </div>
      </div>
    </>
  );
}
