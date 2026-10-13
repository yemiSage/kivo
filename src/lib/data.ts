import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Collection, CollectionWithCount, Item, ItemKind, ItemView } from "./types";
import { ITEM_KINDS } from "./types";

export const MEDIA_BUCKET = "media";
const SIGNED_URL_TTL = 60 * 60 * 6;

export function parseKind(v: string | string[] | undefined): ItemKind | null {
  const s = Array.isArray(v) ? v[0] : v;
  return s && (ITEM_KINDS as readonly string[]).includes(s) ? (s as ItemKind) : null;
}

/** Attach a displayable image URL: signed URL for uploads, else the preview thumbnail. */
export async function withImages(supabase: SupabaseClient, items: Item[]): Promise<ItemView[]> {
  const paths = items.map((i) => i.storage_path).filter((p): p is string => Boolean(p));
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
    data?.forEach((d) => d.path && d.signedUrl && signed.set(d.path, d.signedUrl));
  }
  return items.map((i) => ({
    ...i,
    image: (i.storage_path && signed.get(i.storage_path)) || i.thumbnail_url,
  }));
}

export async function listItems(
  supabase: SupabaseClient,
  opts: { kind?: ItemKind | null; collectionId?: string | null; limit?: number } = {},
): Promise<ItemView[]> {
  let q = supabase
    .from("items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 120);
  if (opts.kind) q = q.eq("kind", opts.kind);
  if (opts.collectionId) q = q.eq("collection_id", opts.collectionId);
  const { data, error } = await q;
  if (error) throw error;
  return withImages(supabase, (data ?? []) as Item[]);
}

export async function searchItems(
  supabase: SupabaseClient,
  query: string,
  kind?: ItemKind | null,
  tag?: string | null,
): Promise<ItemView[]> {
  const q = query.trim().slice(0, 200);
  if (tag) {
    let req = supabase.from("items").select("*").contains("tags", [tag]).order("created_at", { ascending: false }).limit(120);
    if (kind) req = req.eq("kind", kind);
    const { data, error } = await req;
    if (error) throw error;
    return withImages(supabase, (data ?? []) as Item[]);
  }
  if (!q) return listItems(supabase, { kind, limit: 60 });
  const { data, error } = await supabase.rpc("search_items", { q, kind_filter: kind ?? null, lim: 120 });
  if (error) throw error;
  return withImages(supabase, (data ?? []) as Item[]);
}

export async function getItem(supabase: SupabaseClient, id: string): Promise<ItemView | null> {
  const { data } = await supabase.from("items").select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  return (await withImages(supabase, [data as Item]))[0];
}

export async function listCollections(supabase: SupabaseClient): Promise<Collection[]> {
  const { data, error } = await supabase.from("collections").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []) as Collection[];
}

export async function listCollectionsWithCounts(supabase: SupabaseClient): Promise<CollectionWithCount[]> {
  const { data: aggregated, error: aggregateError } = await supabase.rpc("list_vaults_with_counts");
  if (!aggregateError) return (aggregated ?? []) as CollectionWithCount[];

  // Backward-compatible fallback until the shared-vault migration is applied.
  const [collections, { data: rows }] = await Promise.all([
    listCollections(supabase),
    supabase
      .from("items")
      .select("collection_id, thumbnail_url, storage_path, created_at")
      .not("collection_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  const counts = new Map<string, number>();
  const covers = new Map<string, string>();
  for (const r of rows ?? []) {
    counts.set(r.collection_id, (counts.get(r.collection_id) ?? 0) + 1);
    if (!covers.has(r.collection_id) && r.thumbnail_url) covers.set(r.collection_id, r.thumbnail_url);
  }
  return collections.map((c) => ({ ...c, item_count: counts.get(c.id) ?? 0, cover: covers.get(c.id) ?? null }));
}

export async function listTopTags(supabase: SupabaseClient, limit = 12): Promise<string[]> {
  const { data } = await supabase.from("items").select("tags").not("tags", "eq", "{}").limit(1000);
  const freq = new Map<string, number>();
  data?.forEach((r: { tags: string[] }) => r.tags.forEach((t) => freq.set(t, (freq.get(t) ?? 0) + 1)));
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([t]) => t);
}
