/** Bounded in-memory cache. Call only after current RLS-authorized item reads. */
export class SignedUrlCache {
  private entries = new Map<string, { url: string; expiresAt: number }>();
  private maxEntries: number;
  private ttlMs: number;

  constructor(maxEntries = 500, ttlMs = 5 * 60 * 1000) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlMs;
  }

  private key(scope: string, path: string) {
    return JSON.stringify([scope, path]);
  }

  get(scope: string, path: string, now = Date.now()) {
    const key = this.key(scope, path);
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    this.entries.delete(key);
    if (entry.expiresAt <= now) return undefined;
    this.entries.set(key, entry);
    return entry.url;
  }

  set(scope: string, path: string, url: string, now = Date.now()) {
    const key = this.key(scope, path);
    this.entries.delete(key);
    this.entries.set(key, { url, expiresAt: now + this.ttlMs });
    while (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value!);
    }
  }
}
