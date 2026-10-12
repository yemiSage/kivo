/* Kivo service worker: share-target file handling + offline caching. */
const VERSION = "kivo-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const PAGE_CACHE = `${VERSION}-pages`;
const IMAGE_CACHE = `${VERSION}-images`;
const SHARE_CACHE = "kivo-share-inbox"; // not versioned: must survive updates mid-share
const OFFLINE_URL = "/offline";
const SHELL = [OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192.png"];
const MAX_IMAGES = 300;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("kivo-v") && !k.startsWith(VERSION)).map((k) => caches.delete(k)),
      );
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "clear-user-cache") {
    // On sign-out: drop cached pages/images so the next user can't see them offline.
    event.waitUntil(Promise.all([caches.delete(PAGE_CACHE), caches.delete(IMAGE_CACHE), caches.delete(SHARE_CACHE)]));
  }
});

// ───────────────────────────── Share target ─────────────────────────────
async function handleShare(event) {
  const form = await event.request.formData();
  const params = new URLSearchParams({ source: "share" });
  for (const key of ["title", "text", "url"]) {
    const v = form.get(key);
    if (typeof v === "string" && v) params.set(key, v.slice(0, 4000));
  }
  const files = form.getAll("media").filter((f) => typeof f !== "string");
  if (files.length) {
    const cache = await caches.open(SHARE_CACHE);
    const keys = await cache.keys();
    await Promise.all(keys.map((k) => cache.delete(k)));
    await Promise.all(
      files.slice(0, 10).map((file, i) =>
        cache.put(
          `/__share/${i}`,
          new Response(file, {
            headers: {
              "Content-Type": file.type || "application/octet-stream",
              "X-File-Name": encodeURIComponent(file.name || `shared-${i}`),
            },
          }),
        ),
      ),
    );
    params.set("files", String(Math.min(files.length, 10)));
  }
  return Response.redirect(`/save?${params}`, 303);
}

// ─────────────────────────────── Fetching ───────────────────────────────
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirstPage(event) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const preload = await event.preloadResponse;
    const res = preload || (await fetch(event.request));
    if (res.ok && res.type === "basic" && !res.redirected) cache.put(event.request, res.clone());
    return res;
  } catch {
    return (await cache.match(event.request, { ignoreSearch: false })) ||
      (await cache.match(new URL(event.request.url).pathname)) ||
      (await caches.match(OFFLINE_URL));
  }
}

async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  // Signed Supabase URLs change; key on the path so offline still finds them.
  const url = new URL(request.url);
  const key = url.hostname.endsWith(".supabase.co") ? `${url.origin}${url.pathname}` : request.url;
  const hit = await cache.match(key);
  if (hit) return hit;
  try {
    const res = await fetch(request);
    if (res.ok || res.type === "opaque") {
      cache.put(key, res.clone());
      trim(IMAGE_CACHE, MAX_IMAGES);
    }
    return res;
  } catch {
    return new Response("", { status: 504 });
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === "POST" && url.origin === self.location.origin && url.pathname === "/share-target") {
    event.respondWith(handleShare(event));
    return;
  }
  if (request.method !== "GET") return;

  // Shared-file inbox, read by the /save page.
  if (url.origin === self.location.origin && url.pathname.startsWith("/__share/")) {
    event.respondWith(caches.open(SHARE_CACHE).then((c) => c.match(url.pathname)).then((r) => r || new Response("", { status: 404 })));
    return;
  }

  if (request.mode === "navigate") {
    if (url.pathname.startsWith("/auth") || url.pathname.startsWith("/share-target")) return;
    event.respondWith(networkFirstPage(event));
    return;
  }

  if (request.destination === "image") {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (c) => {
        const hit = await c.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) c.put(request, res.clone());
        return res;
      }),
    );
  }
});
