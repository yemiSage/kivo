/** Only allow same-origin relative redirects ("/foo"), never "//evil.com" or absolute URLs. */
export function safeNext(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || /[\\\u0000-\u0020\u007f]/.test(next)) return fallback;
  try {
    const base = new URL("https://kivo.invalid");
    const target = new URL(next, base);
    return target.origin === base.origin ? `${target.pathname}${target.search}${target.hash}` : fallback;
  } catch {
    return fallback;
  }
}
