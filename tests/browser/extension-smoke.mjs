import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

// Isolated headless Chromium only. Never use a person's real browser profile/session.
const extension = fileURLToPath(new URL("../../extensions/chrome/", import.meta.url));
const profile = await mkdtemp(join(tmpdir(), "kivo-extension-test-"));
const context = await chromium.launchPersistentContext(profile, {
  channel: "chromium", headless: true, viewport: { width: 1000, height: 800 },
  args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
});
try {
  // All web documents are fixtures; no production app/backend requests or saves.
  await context.route(/^https?:\/\//, (route) => route.fulfill({
    contentType: "text/html", body: "<!doctype html><title>Extension fixture</title><h1>Test page</h1>",
  }));
  const worker = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker", { timeout: 15000 });
  const extensionId = new URL(worker.url()).host;
  const options = await context.newPage();
  const errors = [];
  options.on("pageerror", (error) => errors.push(error.message));
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.locator("#app-origin").waitFor();
  await options.waitForFunction(() => document.querySelector("#app-origin").value === "https://kivo-save.vercel.app");
  await options.getByLabel("Your Kivo address").fill("http://untrusted.example");
  await options.getByRole("button", { name: "Save settings" }).click();
  await options.locator('#status[data-error="true"]').waitFor();
  assert.match(await options.locator("#status").innerText(), /HTTPS/);
  await options.getByLabel("Your Kivo address").fill("http://localhost:5000");
  await options.getByRole("button", { name: "Save settings" }).click();
  await options.locator('#status[data-error="false"]').waitFor();
  assert.equal(await worker.evaluate(async () => (await chrome.storage.local.get("appOrigin")).appOrigin), "http://localhost:5000");
  await options.reload();
  await options.waitForFunction(() => document.querySelector("#app-origin").value === "http://localhost:5000");
  for (const width of [360, 1000]) {
    await options.setViewportSize({ width, height: 824 });
    assert.ok(await options.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Options overflow at ${width}px`);
  }

  // Capture the actual registered handlers while retaining real storage, tab and badge APIs.
  // Native toolbar/right-click UI activation still belongs in manual acceptance testing.
  await worker.evaluate(async () => {
    const { registerExtension } = await import(chrome.runtime.getURL("service-worker.mjs"));
    registerExtension({
      runtime: { onInstalled: { addListener: (fn) => { globalThis.testInstall = fn; } } },
      action: {
        onClicked: { addListener: (fn) => { globalThis.testAction = fn; } },
        setBadgeText: (value) => chrome.action.setBadgeText(value),
        setTitle: (value) => chrome.action.setTitle(value),
        setBadgeBackgroundColor: (value) => chrome.action.setBadgeBackgroundColor(value),
      },
      contextMenus: {
        onClicked: { addListener: (fn) => { globalThis.testMenu = fn; } },
        removeAll: () => chrome.contextMenus.removeAll(),
        create: (value) => chrome.contextMenus.create(value),
      },
      storage: chrome.storage, tabs: chrome.tabs,
    });
    await globalThis.testInstall();
  });
  const page = await context.newPage();
  await page.goto("https://fixture.example/page?a=1&b=2");
  await page.bringToFront();
  // Tab IDs do not need the broad tabs permission; URLs are supplied by the fixture/user-action event.
  const tabId = await worker.evaluate(async () => (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0].id);
  const opened = context.waitForEvent("page");
  await worker.evaluate(async (id) => globalThis.testAction({ id, url: "https://fixture.example/page?a=1&b=2", title: "Fixture title" }), tabId);
  const handoff = await opened;
  await handoff.waitForURL("http://localhost:5000/save?**");
  const target = new URL(handoff.url());
  assert.equal(target.searchParams.get("url"), "https://fixture.example/page?a=1&b=2");
  assert.equal(target.searchParams.get("title"), "Fixture title");
  assert.equal(page.url(), "https://fixture.example/page?a=1&b=2");
  const next = context.waitForEvent("page");
  await worker.evaluate(async (id) => globalThis.testMenu({ menuItemId: "kivo-save-link", linkUrl: "https://target.example/link" }, { id, title: "Wrong parent title" }), tabId);
  const linkHandoff = await next;
  await linkHandoff.waitForURL("http://localhost:5000/save?**");
  assert.equal(new URL(linkHandoff.url()).searchParams.get("url"), "https://target.example/link");
  assert.equal(new URL(linkHandoff.url()).searchParams.has("title"), false);
  const before = context.pages().length;
  await worker.evaluate(async (id) => globalThis.testAction({ id, url: "chrome://newtab/" }), tabId);
  assert.equal(context.pages().length, before);
  assert.equal(await worker.evaluate((id) => chrome.action.getBadgeText({ tabId: id }), tabId), "!");
  await options.getByRole("button", { name: "Use default" }).click();
  await options.waitForFunction(() => document.querySelector("#app-origin").value === "https://kivo-save.vercel.app");
  assert.equal(await worker.evaluate(async () => (await chrome.storage.local.get("appOrigin")).appOrigin), "https://kivo-save.vercel.app");
  assert.deepEqual(errors, []);
  console.log("Chromium extension smoke test passed: MV3 load, options validation/persistence/reset, mobile/desktop fit, real tab handoff, link title isolation, source-tab preservation and error badge.");
  console.log(`Isolated test profile (no account data): ${profile}`);
} finally {
  await context.close();
}
