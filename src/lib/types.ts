export const ITEM_KINDS = ["image", "video", "article", "post", "link"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

export type MetadataStatus = "pending" | "ok" | "partial" | "failed";

export interface Item {
  id: string;
  user_id: string;
  kind: ItemKind;
  url: string | null;
  canonical_url: string | null;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  site_name: string | null;
  platform: string | null;
  author: string | null;
  storage_path: string | null;
  collection_id: string | null;
  tags: string[];
  notes: string | null;
  suggested_category: string | null;
  metadata_status: MetadataStatus;
  created_at: string;
  updated_at: string;
}

/** Item plus a resolved, displayable image URL (signed URL for uploads). */
export interface ItemView extends Item {
  image: string | null;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  emoji: string | null;
  created_at: string;
}

export interface CollectionWithCount extends Collection {
  item_count: number;
  cover: string | null;
}

export interface LinkMetadata {
  url: string;
  canonicalUrl: string;
  title: string | null;
  description: string | null;
  image: string | null;
  siteName: string | null;
  author: string | null;
  platform: Platform;
  kind: ItemKind;
  status: MetadataStatus;
}

export type Platform =
  | "instagram"
  | "tiktok"
  | "x"
  | "pinterest"
  | "facebook"
  | "youtube"
  | "reddit"
  | "linkedin"
  | "threads"
  | "vimeo"
  | "web";

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; code?: string };
