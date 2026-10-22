import { IntentLink as Link } from "./IntentLink";
import type { ItemKind, ItemView, Platform } from "@/lib/types";
import { hostLabel, PLATFORM_LABEL } from "@/lib/url";
import { cn } from "@/lib/utils";
import { ArticleIcon, ImageIcon, LinkIcon, PostIcon, VideoIcon, type IconProps } from "./icons";
import { MediaThumbnail } from "./MediaThumbnail";
import { ItemCardActions } from "./ItemCardActions";
import { ContentLayout } from "./ContentLayout";

export const KIND_META: Record<ItemKind, { label: string; plural: string; Icon: (p: IconProps) => React.ReactNode }> = {
  image: { label: "Image", plural: "Images", Icon: ImageIcon },
  video: { label: "Video", plural: "Videos", Icon: VideoIcon },
  article: { label: "Article", plural: "Articles", Icon: ArticleIcon },
  post: { label: "Post", plural: "Posts", Icon: PostIcon },
  link: { label: "Link", plural: "Links", Icon: LinkIcon },
};

export function sourceLabel(item: Pick<ItemView, "platform" | "site_name" | "url">) {
  if (item.platform && item.platform !== "web") return PLATFORM_LABEL[item.platform as Platform] ?? item.platform;
  return item.site_name || hostLabel(item.url) || "Upload";
}

export function ItemThumb({
  item,
  className = "",
  eager = false,
}: {
  item: Pick<ItemView, "image" | "kind" | "title" | "url"> & Partial<Pick<ItemView, "image_position_x" | "image_position_y">>;
  className?: string;
  eager?: boolean;
}) {
  const { Icon } = KIND_META[item.kind];
  if (item.image) {
    return (
      <MediaThumbnail
        src={item.image}
        eager={eager}
        style={{ objectPosition: `${item.image_position_x ?? 50}% ${item.image_position_y ?? 50}%` }}
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary p-4 text-muted-foreground group-data-[layout=list]/layout:p-2", className)}>
      <Icon size={28} />
      <span className="line-clamp-2 text-center text-xs font-medium group-data-[layout=list]/layout:hidden">{hostLabel(item.url) || item.title}</span>
    </div>
  );
}

export function ItemCard({ item, eager = false }: { item: ItemView; eager?: boolean }) {
  const { Icon, label } = KIND_META[item.kind];
  return (
    <article className="group rounded-2xl border bg-card p-2 group-data-[layout=list]/layout:flex group-data-[layout=list]/layout:items-center group-data-[layout=list]/layout:gap-3">
    <Link
      href={`/item/${item.id}`}
      className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40 group-data-[layout=list]/layout:flex group-data-[layout=list]/layout:min-w-0 group-data-[layout=list]/layout:flex-1 group-data-[layout=list]/layout:items-center group-data-[layout=list]/layout:gap-3"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary group-data-[layout=list]/layout:aspect-square group-data-[layout=list]/layout:size-16 group-data-[layout=list]/layout:shrink-0 sm:group-data-[layout=list]/layout:size-20">
        <ItemThumb item={item} eager={eager} />
      </div>
      <div className="px-1.5 pb-1.5 pt-3 group-data-[layout=list]/layout:min-w-0 group-data-[layout=list]/layout:flex-1 group-data-[layout=list]/layout:p-0">
        <p className="truncate text-xs font-medium leading-snug md:text-[15px] group-data-[layout=list]/layout:line-clamp-2 group-data-[layout=list]/layout:whitespace-normal">{item.title || hostLabel(item.url) || "Untitled"}</p>
        <p className="mt-1 hidden truncate text-xs text-muted-foreground group-data-[layout=list]/layout:block">{sourceLabel(item)}</p>
      </div>
    </Link>
    <div className="mt-2 flex items-center justify-between gap-1 group-data-[layout=list]/layout:mt-0 group-data-[layout=list]/layout:shrink-0">
      <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 md:text-xs max-sm:group-data-[layout=list]/layout:hidden">
        <Icon size={13} />
        <span className="truncate">{label}</span>
      </span>
      <ItemCardActions id={item.id} title={item.title || hostLabel(item.url) || "Untitled"} />
    </div>
    </article>
  );
}

export function ItemGrid({ items }: { items: ItemView[] }) {
  return (
    <ContentLayout showControl={false}>
    <ul className="grid grid-cols-1 gap-3 group-data-[layout=grid]/layout:grid-cols-2 sm:group-data-[layout=grid]/layout:grid-cols-3 lg:group-data-[layout=grid]/layout:grid-cols-4">
      {items.map((item, i) => (
        <li key={item.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
          <ItemCard item={item} eager={i < 2} />
        </li>
      ))}
    </ul>
    </ContentLayout>
  );
}
