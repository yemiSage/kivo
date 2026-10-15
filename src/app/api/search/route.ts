import { NextResponse, type NextRequest } from "next/server";
import { withImages } from "@/lib/data";
import { getServerSupabase } from "@/lib/supabase/server";
import { escapeSearchPattern, itemSearchCategory, matchingTags, SEARCH_CATEGORIES, searchSettings, selectSearchItems, type SearchGroup, type SearchResult } from "@/lib/search";
import type { Item } from "@/lib/types";
import { hostLabel } from "@/lib/url";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 200) ?? "";
  const headers = { "Cache-Control": "private, no-store" };
  if (!query) return NextResponse.json({ groups: [] }, { headers });

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return NextResponse.json({ error: "unauthorized" }, { status: 401, headers });

  try {
    const value = query.replace(/^#+/, "");
    if (!value) return NextResponse.json({ groups: [] }, { headers });
    // Both queries use the caller's RLS policies. Never use the admin client here.
    const [itemResponse, vaultResponse] = await Promise.all([
      supabase.rpc("search_items", { q: value, kind_filter: null, lim: 120 }).abortSignal(request.signal),
      supabase.from("collections").select("id, name").ilike("name", `%${escapeSearchPattern(value)}%`).order("name").limit(6).abortSignal(request.signal),
    ]);
    if (itemResponse.error || vaultResponse.error) throw new Error("search_failed");
    const matched = (itemResponse.data ?? []) as Item[];
    const grouped = new Map<string, SearchResult[]>();
    grouped.set("tags", matchingTags(matched, value).map((tag) => ({ id: tag, title: `#${tag}`, subtitle: "View tagged items", href: `/?tag=${encodeURIComponent(tag)}` })));
    grouped.set("vaults", (vaultResponse.data ?? []).map((vault) => ({ id: vault.id, title: vault.name, subtitle: "Vault", href: `/collections/${vault.id}` })));
    grouped.set("settings", searchSettings(value));

    // Limit each group before signing images; avoid signing hidden results.
    const items = await withImages(supabase, selectSearchItems(matched));
    for (const item of items) {
      const category = itemSearchCategory(item);
      const results = grouped.get(category) ?? [];
      results.push({
        id: item.id,
        title: item.title || hostLabel(item.url) || "Untitled",
        subtitle: item.storage_path ? "Uploaded file" : item.site_name || hostLabel(item.url) || "Saved item",
        href: `/item/${item.id}`,
        kind: item.kind,
        image: item.image,
        image_position_x: item.image_position_x,
        image_position_y: item.image_position_y,
      });
      grouped.set(category, results);
    }
    const groups: SearchGroup[] = SEARCH_CATEGORIES.map((category) => ({ ...category, results: grouped.get(category.id) ?? [] })).filter((group) => group.results.length > 0);
    return NextResponse.json({ groups }, { headers });
  } catch {
    return NextResponse.json({ error: "search_failed" }, { status: 500, headers });
  }
}
