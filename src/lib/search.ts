import type { Item, ItemKind } from "./types";

export const SEARCH_CATEGORIES = [
  { id: "tags", label: "Tags" },
  { id: "vaults", label: "Vaults" },
  { id: "files", label: "Files" },
  { id: "links", label: "Links" },
  { id: "videos", label: "Videos" },
  { id: "images", label: "Images" },
  { id: "settings", label: "Settings" },
] as const;

export type SearchCategory = (typeof SEARCH_CATEGORIES)[number]["id"];
export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  image?: string | null;
  kind?: ItemKind;
  image_position_x?: number;
  image_position_y?: number;
}
export interface SearchGroup {
  id: SearchCategory;
  label: string;
  results: SearchResult[];
}
export interface SearchResponse { groups: SearchGroup[] }

export function itemSearchCategory(item: Pick<Item, "kind" | "storage_path"> & Partial<Pick<Item, "url">>): SearchCategory {
  // Media keeps its specific category even when it was uploaded as a file.
  if (item.kind === "image") return "images";
  if (item.kind === "video") return "videos";
  if (item.storage_path) return "files";
  if (item.url) {
    try {
      if (/\.(pdf|docx?|xlsx?|pptx?|csv|txt|md|zip|rar|7z|json)$/i.test(new URL(item.url).pathname)) return "files";
    } catch { /* Invalid legacy URLs remain ordinary links. */ }
  }
  // Articles and social posts are saved links, too.
  return "links";
}

export function selectSearchItems<T extends Pick<Item, "id" | "kind" | "storage_path">>(items: T[], perCategory = 6): T[] {
  const counts = new Map<SearchCategory, number>();
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    const category = itemSearchCategory(item);
    const count = counts.get(category) ?? 0;
    if (count >= perCategory) return false;
    counts.set(category, count + 1);
    return true;
  });
}

export function matchingTags(items: Pick<Item, "tags">[], query: string, limit = 6): string[] {
  const value = query.trim().replace(/^#+/, "").toLowerCase();
  if (!value) return [];
  const tags = [...new Set(items.flatMap((item) => item.tags))].filter((tag) => tag.toLowerCase().includes(value));
  const rank = (tag: string) => tag.toLowerCase() === value ? 0 : tag.toLowerCase().startsWith(value) ? 1 : 2;
  return tags.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)).slice(0, limit);
}

const SETTINGS = [
  { id: "account", title: "Account", subtitle: "Your profile and account details", href: "/profile#account", keywords: "settings preferences profile account email" },
  { id: "privacy", title: "Privacy", subtitle: "How Kivo protects your library", href: "/profile#privacy", keywords: "settings preferences privacy security private storage" },
  { id: "sign-out", title: "Sign out", subtitle: "Open your account to sign out", href: "/profile#sign-out", keywords: "settings account sign out logout log out" },
];

export function searchSettings(query: string): SearchResult[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return SETTINGS.filter((setting) => words.every((word) => `${setting.title} ${setting.keywords}`.toLowerCase().includes(word)))
    .map(({ keywords: _keywords, ...setting }) => setting);
}

/** Escape pattern characters so user input is a literal vault-name search. */
export function escapeSearchPattern(query: string) {
  return query.replace(/[\\%_]/g, "\\$&");
}
