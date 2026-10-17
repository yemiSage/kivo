export const DEFAULT_APP_ORIGIN = "https://kivo-save.vercel.app";
export const ACTION_TITLE = "Save this page to Kivo";

/** Origins only: never let a stored path/query change the save destination. */
export function normalizeAppOrigin(value) {
  let url;
  try { url = new URL(value.trim()); }
  catch { throw new Error("Enter a complete Kivo address, such as https://kivo-save.vercel.app."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
    throw new Error("Use HTTPS, or HTTP on localhost for development.");
  }
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Enter only the app origin, without a path, credentials, query or fragment.");
  }
  return url.origin;
}

export function buildSaveUrl({ appOrigin = DEFAULT_APP_ORIGIN, url: rawUrl, title = "" }) {
  let source;
  try { source = new URL(rawUrl); }
  catch { throw new Error("Open a regular website or right-click a web link to save it."); }
  if (!["http:", "https:"].includes(source.protocol) || source.username || source.password) {
    throw new Error("Kivo can save HTTP and HTTPS links, not browser pages or local files.");
  }
  // The app's shared parameters have a 4000-character limit. Never silently truncate a URL.
  if (source.href.length > 4000) throw new Error("This link is too long to send to Kivo. Copy a shorter public link.");
  const target = new URL("/save", normalizeAppOrigin(appOrigin));
  if (source.origin === target.origin) throw new Error("Open the page you want to save, rather than Kivo itself.");
  target.searchParams.set("url", source.href);
  if (typeof title === "string" && title.trim()) target.searchParams.set("title", title.trim().slice(0, 300));
  target.searchParams.set("source", "chrome-extension");
  return target.href;
}

export function contextSaveInput(info, tab) {
  if (info.menuItemId === "kivo-save-link") return { url: info.linkUrl };
  if (info.menuItemId === "kivo-save-page") return { url: info.pageUrl || tab?.url, title: tab?.title };
  return null;
}
