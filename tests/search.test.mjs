import assert from "node:assert/strict";
import test from "node:test";
import { escapeSearchPattern, itemSearchCategory, matchingTags, SEARCH_CATEGORIES, searchSettings, selectSearchItems } from "../src/lib/search.ts";

test("search categories cover each requested type in order", () => {
  assert.deepEqual(SEARCH_CATEGORIES.map(({ label }) => label), ["Tags", "Vaults", "Files", "Links", "Videos", "Images", "Settings"]);
});

test("uploaded media stays in its media category and saved posts are links", () => {
  assert.equal(itemSearchCategory({ kind: "image", storage_path: "user/photo.webp" }), "images");
  assert.equal(itemSearchCategory({ kind: "video", storage_path: "user/video.mp4" }), "videos");
  assert.equal(itemSearchCategory({ kind: "link", storage_path: "user/file.pdf" }), "files");
  assert.equal(itemSearchCategory({ kind: "article", storage_path: null }), "links");
  assert.equal(itemSearchCategory({ kind: "post", storage_path: null }), "links");
  assert.equal(itemSearchCategory({ kind: "link", storage_path: null, url: "https://example.com/report.pdf?download=1" }), "files");
  assert.equal(itemSearchCategory({ kind: "link", storage_path: null, url: "https://example.com/article?name=report.pdf" }), "links");
});

test("group limits and deduplication do not let image matches hide video matches", () => {
  const images = Array.from({ length: 12 }, (_, i) => ({ id: `image-${i}`, kind: "image", storage_path: null }));
  const video = { id: "video", kind: "video", storage_path: null };
  const results = selectSearchItems([...images, images[0], video], 6);
  assert.equal(results.filter((item) => item.kind === "image").length, 6);
  assert.equal(results.length, 7);
  assert.equal(results.at(-1).id, "video");
});

test("tag matches deduplicate, support # syntax and rank exact matches first", () => {
  const items = [{ tags: ["design-ideas", "design", "web-design"] }, { tags: ["design", "other"] }];
  assert.deepEqual(matchingTags(items, "#DESIGN"), ["design", "design-ideas", "web-design"]);
  assert.deepEqual(matchingTags(items, "#"), []);
});

test("settings match real destinations without executing account actions", () => {
  assert.equal(searchSettings("settings").length, 3);
  assert.equal(searchSettings("privacy")[0].href, "/profile#privacy");
  assert.equal(searchSettings("log out")[0].href, "/profile#sign-out");
  assert.deepEqual(searchSettings("wedding"), []);
});

test("vault search treats wildcard characters literally", () => {
  assert.equal(escapeSearchPattern("100%_saved\\items"), "100\\%\\_saved\\\\items");
});
