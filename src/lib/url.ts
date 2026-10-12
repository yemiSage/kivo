import type { ItemKind, Platform } from "./types";

const URL_RE = /\bhttps?:\/\/[^\s<>"'`]+/i;
const BARE_DOMAIN_RE = /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?$/i;

/**
 * Finds the first URL in arbitrary shared text. Apps like Instagram and TikTok
 * share "Check this out! https://…" in the `text` field instead of `url`.
 */
export function extractUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const match = trimmed.match(URL_RE);
  if (match) return match[0].replace(/[),.;!?]+$/, "");
  if (BARE_DOMAIN_RE.test(trimmed)) return `https://${trimmed}`;
  return null;
}

export function parseHttpUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (u.username || u.password) return null;
    return u;
  } catch {
    return null;
  }
}

const TRACKING_PARAMS = new Set([
  "fbclid", "gclid", "igshid", "igsh", "si", "mc_cid", "mc_eid", "ref_src", "ref_url",
  "share_id", "sender_device", "is_from_webapp", "rdt", "mibextid", "feature", "pp",
]);
// Short params that are tracking noise only on some hosts (on YouTube, `t` is a timestamp worth keeping).
const SHORT_TRACKING_PARAMS = new Set(["s", "t", "_t", "_r"]);
const STRIP_SHORT_PARAMS_HOSTS = /(^|\.)(x\.com|twitter\.com|tiktok\.com|instagram\.com|threads\.net)$/;

/** Stable form of a URL for de-duplication: no tracking params, hash or trailing slash. */
export function canonicalize(raw: string): string {
  const u = parseHttpUrl(raw);
  if (!u) return raw;
  u.hash = "";
  u.hostname = u.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.)/, "");
  if (u.hostname === "twitter.com") u.hostname = "x.com";
  // youtu.be/ID and /shorts/ID → youtube.com/watch?v=ID
  const yt = u.hostname === "youtu.be" ? u.pathname.slice(1) : u.hostname === "youtube.com" ? u.pathname.match(/^\/shorts\/([\w-]+)/)?.[1] : null;
  if (yt) {
    u.hostname = "youtube.com";
    u.pathname = "/watch";
    u.searchParams.set("v", yt);
  }
  const stripShort = STRIP_SHORT_PARAMS_HOSTS.test(u.hostname);
  for (const key of [...u.searchParams.keys()]) {
    const k = key.toLowerCase();
    if (k.startsWith("utm_") || TRACKING_PARAMS.has(k) || (stripShort && SHORT_TRACKING_PARAMS.has(k))) {
      u.searchParams.delete(key);
    }
  }
  u.searchParams.sort();
  let out = u.toString();
  if (u.pathname !== "/" && out.endsWith("/")) out = out.slice(0, -1);
  if (u.pathname === "/" && !u.search) out = out.replace(/\/$/, "");
  return out;
}

const PLATFORM_HOSTS: [RegExp, Platform][] = [
  [/(^|\.)instagram\.com$|(^|\.)instagr\.am$/, "instagram"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)(x|twitter)\.com$|(^|\.)t\.co$/, "x"],
  [/(^|\.)pinterest\.[a-z.]+$|(^|\.)pin\.it$/, "pinterest"],
  [/(^|\.)facebook\.com$|(^|\.)fb\.watch$|(^|\.)fb\.com$/, "facebook"],
  [/(^|\.)youtube\.com$|(^|\.)youtu\.be$/, "youtube"],
  [/(^|\.)reddit\.com$|(^|\.)redd\.it$/, "reddit"],
  [/(^|\.)linkedin\.com$|(^|\.)lnkd\.in$/, "linkedin"],
  [/(^|\.)threads\.(net|com)$/, "threads"],
  [/(^|\.)vimeo\.com$/, "vimeo"],
];

export function detectPlatform(raw: string): Platform {
  const u = parseHttpUrl(raw);
  if (!u) return "web";
  const host = u.hostname.toLowerCase();
  return PLATFORM_HOSTS.find(([re]) => re.test(host))?.[1] ?? "web";
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X",
  pinterest: "Pinterest",
  facebook: "Facebook",
  youtube: "YouTube",
  reddit: "Reddit",
  linkedin: "LinkedIn",
  threads: "Threads",
  vimeo: "Vimeo",
  web: "Web",
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|heic)$/i;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i;

/** Best guess of content kind from URL shape alone, refined later by metadata. */
export function guessKind(raw: string, platform: Platform, ogType?: string | null): ItemKind {
  const u = parseHttpUrl(raw);
  const path = u?.pathname ?? "";
  if (IMAGE_EXT.test(path)) return "image";
  if (VIDEO_EXT.test(path)) return "video";

  switch (platform) {
    case "youtube":
    case "vimeo":
    case "tiktok":
      return "video";
    case "instagram":
      return /\/(reel|reels|tv)\//.test(path) ? "video" : "post";
    case "facebook":
      return /\/(watch|reel|videos)\b/.test(path) || u?.hostname.includes("fb.watch") ? "video" : "post";
    case "pinterest":
      return "image";
    case "x":
    case "threads":
    case "reddit":
    case "linkedin":
      return "post";
  }

  const t = (ogType ?? "").toLowerCase();
  if (t.startsWith("video")) return "video";
  if (t === "article" || t.startsWith("article")) return "article";
  if (/\/(blog|article|articles|posts?|news|story|stories)\//i.test(path) || /\/\d{4}\/\d{2}\//.test(path)) {
    return "article";
  }
  return "link";
}

export function hostLabel(raw: string | null): string {
  if (!raw) return "";
  const u = parseHttpUrl(raw);
  return u ? u.hostname.replace(/^www\./, "") : "";
}
