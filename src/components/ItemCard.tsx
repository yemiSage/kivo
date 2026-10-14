import Link from "next/link";
import type { ItemKind, ItemView, Platform } from "@/lib/types";
import { hostLabel, PLATFORM_LABEL } from "@/lib/url";
import { cn } from "@/lib/utils";
import { ArticleIcon, ImageIcon, LinkIcon, PostIcon, VideoIcon, type IconProps } from "./icons";

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

export function ItemThumb({ item, className = "" }: { item: Pick<ItemView, "image" | "kind" | "title" | "url">; className?: string }) {
  const { Icon } = KIND_META[item.kind];
  if (item.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary third-party hosts
      <img src={item.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className={cn("h-full w-full object-cover", className)} />
    );
  }
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary p-4 text-muted-foreground", className)}>
      <Icon size={28} />
      <span className="line-clamp-2 text-center text-xs font-medium">{hostLabel(item.url) || item.title}</span>
    </div>
  );
}

export function ItemCard({ item }: { item: ItemView }) {
  const { Icon, label } = KIND_META[item.kind];
  return (
    <Link
      href={`/item/${item.id}`}
      className="group block rounded-2xl border bg-card p-2 outline-none transition hover:border-black/10 hover:shadow-[0_8px_24px_-12px_rgb(40_40_30/0.18)] focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-secondary">
        <ItemThumb item={item} className="transition duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="px-1.5 pb-1.5 pt-3">
        <p className="truncate text-xs font-medium leading-snug md:text-[15px]">{item.title || hostLabel(item.url) || "Untitled"}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-1.5 py-0.5 font-medium text-foreground/80">
            <Icon size={13} />
            {label}
          </span>
          <span className="truncate">{sourceLabel(item)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ItemGrid({ items }: { items: ItemView[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <li key={item.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
          <ItemCard item={item} />
        </li>
      ))}
    </ul>
  );
}
