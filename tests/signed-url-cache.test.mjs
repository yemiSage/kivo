import assert from "node:assert/strict";
import test from "node:test";
import { SignedUrlCache } from "../src/lib/signed-url-cache.ts";

test("signed URLs stay isolated by session and storage path", () => {
  const cache = new SignedUrlCache();
  cache.set("session-a", "user/image.webp", "signed-a", 0);
  assert.equal(cache.get("session-a", "user/image.webp", 1), "signed-a");
  assert.equal(cache.get("session-b", "user/image.webp", 1), undefined);
  assert.equal(cache.get("session-a", "user/other.webp", 1), undefined);
});

test("reads do not extend URL expiry", () => {
  const cache = new SignedUrlCache(2, 100);
  cache.set("session", "image", "url", 0);
  assert.equal(cache.get("session", "image", 99), "url");
  assert.equal(cache.get("session", "image", 100), undefined);
});

test("cache stays bounded and evicts the least recently read URL", () => {
  const cache = new SignedUrlCache(2);
  cache.set("session", "a", "a", 0);
  cache.set("session", "b", "b", 0);
  cache.get("session", "a", 1);
  cache.set("session", "c", "c", 2);
  assert.equal(cache.get("session", "b", 3), undefined);
  assert.equal(cache.get("session", "a", 3), "a");
  assert.equal(cache.get("session", "c", 3), "c");
});
