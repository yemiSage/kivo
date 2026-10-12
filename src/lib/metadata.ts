import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { LinkMetadata, Platform } from "./types";
import { canonicalize, detectPlatform, guessKind, parseHttpUrl, PLATFORM_LABEL } from "./url";

/*
 * Server-side link preview extraction.
 *
 * Policy: we only read what a site publishes for link previews (Open Graph /
 * Twitter Card tags and official oEmbed endpoints). We identify ourselves with
 * an honest User-Agent, never send cookies, never download media, and never try
 * to get around login walls. When a platform withholds metadata (Instagram and
 * Facebook usually do), the item is saved with status "partial" and the
 * original URL, which is always the source of truth.
 */

const USER_AGENT = `KivoBot/1.0 (+${process.env.NEXT_PUBLIC_SITE_URL ?? "https://kivo.app"}; link preview)`;
const FETCH_TIMEOUT_MS = 6000;
const MAX_HTML_BYTES = 768 * 1024;
const MAX_REDIRECTS = 5;

// ─────────────────────────── SSRF protection ───────────────────────────

function isPrivateIPv4(ip: string) {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIP(ip: string) {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v6);
}

async function assertPublicHost(u: URL) {
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new Error("blocked host");
  }
  if (u.port && !["80", "443", "8080", "8443"].includes(u.port)) throw new Error("blocked port");
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true, verbatim: true });
  if (!addrs.length || addrs.some((a) => isPrivateIP(a.address))) throw new Error("blocked address");
}

// ─────────────────────────────── Fetching ──────────────────────────────

async function readCapped(res: Response, cap: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < cap) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.byteLength;
    // </head> is all we need; stop early to save bandwidth.
    if (new TextDecoder().decode(value).includes("</head>")) break;
  }
  await reader.cancel().catch(() => {});
  const buf = new Uint8Array(Math.min(total, cap));
  let off = 0;
  for (const c of chunks) {
    const slice = c.subarray(0, Math.min(c.byteLength, buf.byteLength - off));
    buf.set(slice, off);
    off += slice.byteLength;
    if (off >= buf.byteLength) break;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buf);
}

async function safeFetchHtml(start: string): Promise<{ finalUrl: string; html: string; contentType: string }> {
  let current = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = parseHttpUrl(current);
    if (!u) throw new Error("invalid url");
    await assertPublicHost(u);

    const res = await fetch(u, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        "Accept-Language": "en;q=0.9,*;q=0.5",
      },
      cache: "no-store",
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      await res.body?.cancel().catch(() => {});
      if (!loc) throw new Error("redirect without location");
      current = new URL(loc, u).toString();
      continue;
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!res.ok) {
      await res.body?.cancel().catch(() => {});
      throw Object.assign(new Error(`status ${res.status}`), { finalUrl: current });
    }
    if (!/text\/html|application\/xhtml/i.test(contentType)) {
      await res.body?.cancel().catch(() => {});
      return { finalUrl: current, html: "", contentType };
    }
    return { finalUrl: current, html: await readCapped(res, MAX_HTML_BYTES), contentType };
  }
  throw new Error("too many redirects");
}

// ─────────────────────────────── Parsing ───────────────────────────────

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

function decodeEntities(s: string) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z#0-9]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

function clean(s: string | null | undefined, max: number): string | null {
  if (!s) return null;
  const out = decodeEntities(s).replace(/\s+/g, " ").trim();
  return out ? out.slice(0, max) : null;
}

function parseHead(html: string) {
  const head = html.slice(0, html.search(/<\/head>/i) + 1 || html.length);
  const meta = new Map<string, string>();
  for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
    const attr = (name: string) =>
      tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))?.slice(2).find((v) => v !== undefined);
    const key = (attr("property") ?? attr("name") ?? attr("itemprop"))?.toLowerCase();
    const content = attr("content");
    if (key && content && !meta.has(key)) meta.set(key, content);
  }
  const linkHref = (rel: string) =>
    head.match(new RegExp(`<link\\b[^>]*rel=["']?${rel}["']?[^>]*>`, "i"))?.[0].match(/href=["']?([^"'\s>]+)/i)?.[1];

  return {
    title: meta.get("og:title") ?? meta.get("twitter:title") ?? head.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? null,
    description: meta.get("og:description") ?? meta.get("twitter:description") ?? meta.get("description") ?? null,
    image: meta.get("og:image:secure_url") ?? meta.get("og:image") ?? meta.get("twitter:image") ?? meta.get("twitter:image:src") ?? null,
    siteName: meta.get("og:site_name") ?? meta.get("application-name") ?? null,
    author: meta.get("author") ?? meta.get("article:author") ?? meta.get("twitter:creator") ?? null,
    type: meta.get("og:type") ?? null,
    canonical: meta.get("og:url") ?? linkHref("canonical") ?? null,
  };
}

function absolutize(maybe: string | null, base: string): string | null {
  if (!maybe) return null;
  try {
    const u = new URL(decodeEntities(maybe), base);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

// ──────────────────────────────── oEmbed ───────────────────────────────

// Public oEmbed endpoints that need no API token. Instagram/Facebook require an
// app token + review, so they are intentionally absent.
const OEMBED: Partial<Record<Platform, (url: string) => string>> = {
  youtube: (u) => `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u)}`,
  tiktok: (u) => `https://www.tiktok.com/oembed?url=${encodeURIComponent(u)}`,
  x: (u) => `https://publish.twitter.com/oembed?omit_script=1&dnt=1&url=${encodeURIComponent(u)}`,
  vimeo: (u) => `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(u)}`,
  reddit: (u) => `https://www.reddit.com/oembed?url=${encodeURIComponent(u)}`,
  pinterest: (u) => `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(u)}`,
};

interface OEmbed {
  title?: string;
  author_name?: string;
  provider_name?: string;
  thumbnail_url?: string;
  html?: string;
}

async function fetchOEmbed(platform: Platform, url: string): Promise<OEmbed | null> {
  const build = OEMBED[platform];
  if (!build) return null;
  try {
    const res = await fetch(build(url), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as OEmbed;
  } catch {
    return null;
  }
}

function textFromEmbedHtml(html?: string) {
  if (!html) return null;
  const p = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] ?? "";
  return clean(p.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, ""), 1000);
}

// ─────────────────────────────── Public API ────────────────────────────

const cache = new Map<string, { at: number; value: LinkMetadata }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function getLinkMetadata(rawUrl: string): Promise<LinkMetadata> {
  const key = canonicalize(rawUrl);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const value = await extract(rawUrl);
  cache.set(key, { at: Date.now(), value });
  if (cache.size > 500) cache.delete(cache.keys().next().value!);
  return value;
}

// Placeholder titles served to logged-out visitors / bots. Better to show nothing.
const GENERIC_TITLE =
  /^(instagram|facebook|log ?in.*|sign ?in.*|tiktok( - make your day)?|x|twitter|pinterest|threads|reddit.*dive into anything|youtube|just a moment\.*|access denied|attention required.*|before you continue.*)$/i;

async function extract(rawUrl: string): Promise<LinkMetadata> {
  const rawPlatform = detectPlatform(rawUrl);
  // Known platforms: query oEmbed in parallel with the page fetch.
  const earlyOEmbed = fetchOEmbed(rawPlatform, rawUrl);

  let finalUrl = rawUrl;
  let head: ReturnType<typeof parseHead> | null = null;
  let isImage = false;
  let isVideo = false;

  try {
    const page = await safeFetchHtml(rawUrl);
    finalUrl = page.finalUrl;
    isImage = /^image\//i.test(page.contentType);
    isVideo = /^video\//i.test(page.contentType);
    if (page.html) head = parseHead(page.html);
  } catch (err) {
    const f = (err as { finalUrl?: string }).finalUrl;
    if (f) finalUrl = f;
  }

  // A platform link that redirected off-platform hit a consent/bot/login wall:
  // ignore that page entirely and keep the original URL.
  if (rawPlatform !== "web" && detectPlatform(finalUrl) !== rawPlatform) {
    finalUrl = rawUrl;
    head = null;
  }

  const platform = detectPlatform(finalUrl);
  const oembed =
    (await earlyOEmbed) ?? (platform !== rawPlatform || finalUrl !== rawUrl ? await fetchOEmbed(platform, finalUrl) : null);
  if (head?.title && GENERIC_TITLE.test(clean(head.title, 300) ?? "")) {
    head.title = null;
    if (head.description && /log ?in|sign ?up|create an account/i.test(head.description)) head.description = null;
  }

  const canonicalSource = absolutize(head?.canonical ?? null, finalUrl) ?? finalUrl;
  // Only trust og:url when it stays on the same site (some sites point it at a homepage).
  const sameSite = parseHttpUrl(canonicalSource)?.hostname.replace(/^www\./, "") === parseHttpUrl(finalUrl)?.hostname.replace(/^www\./, "");
  const canonicalUrl = canonicalize(sameSite && (parseHttpUrl(canonicalSource)?.pathname.length ?? 0) > 1 ? canonicalSource : finalUrl);

  const title = clean(oembed?.title, 300) ?? clean(head?.title, 300) ?? (platform === "x" ? textFromEmbedHtml(oembed?.html)?.slice(0, 140) ?? null : null);
  const description = clean(head?.description, 1000) ?? textFromEmbedHtml(oembed?.html);
  const image = absolutize(oembed?.thumbnail_url ?? null, finalUrl) ?? absolutize(head?.image ?? null, finalUrl) ?? (isImage ? finalUrl : null);
  const siteName = clean(oembed?.provider_name, 80) ?? clean(head?.siteName, 80) ?? (platform !== "web" ? PLATFORM_LABEL[platform] : null);
  const author = clean(oembed?.author_name, 120) ?? clean(head?.author, 120);

  let kind = guessKind(finalUrl, platform, head?.type);
  if (isImage) kind = "image";
  if (isVideo) kind = "video";

  const got = [title, description, image].filter(Boolean).length;
  const status = got === 3 || (got >= 2 && title) ? "ok" : got > 0 ? "partial" : "failed";

  return {
    url: rawUrl,
    canonicalUrl,
    title,
    description,
    image,
    siteName,
    author,
    platform,
    kind,
    status,
  };
}
