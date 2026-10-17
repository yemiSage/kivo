import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { ACTION_TITLE, DEFAULT_APP_ORIGIN, normalizeAppOrigin, buildSaveUrl, contextSaveInput } from "../extensions/chrome/save-url.mjs";
import { registerExtension } from "../extensions/chrome/service-worker.mjs";

test("extension accepts HTTPS app origins and loopback-only development HTTP", () => {
  assert.equal(normalizeAppOrigin(" https://kivo-save.vercel.app/ "), DEFAULT_APP_ORIGIN);
  for (const value of ["http://localhost:5000", "http://127.0.0.1:5000", "http://[::1]:5000", "https://own-kivo.example"]) {
    assert.equal(normalizeAppOrigin(value), value);
  }
  for (const value of ["http://other.example", "javascript:alert(1)", "https://user:pass@kivo.example", "https://kivo.example/save", "https://kivo.example/?redirect=evil", "https://kivo.example/#fragment", "//kivo.example", "not a url"]) {
    assert.throws(() => normalizeAppOrigin(value));
  }
});

test("extension safely encodes the URL/title without leaking page parameters into the handoff", () => {
  const original = "https://example.com/path?a=1&next=https%3A%2F%2Fother.example#part";
  const title = 'A <title> & "quoted"';
  const target = new URL(buildSaveUrl({ url: original, title }));
  assert.equal(target.origin, DEFAULT_APP_ORIGIN);
  assert.equal(target.pathname, "/save");
  assert.equal(target.searchParams.get("url"), original);
  assert.equal(target.searchParams.get("title"), title);
  assert.equal(target.searchParams.get("source"), "chrome-extension");
  assert.equal(target.searchParams.has("next"), false);
  assert.equal(new URL(buildSaveUrl({ appOrigin: "http://localhost:5000", url: original })).origin, "http://localhost:5000");
});

test("extension rejects restricted, malformed, credential-bearing, own-app and oversized URLs", () => {
  for (const url of [undefined, "chrome://extensions", "file:///private/test.png", "javascript:alert(1)", "data:text/plain,test", "https://user:pass@example.com/", `${DEFAULT_APP_ORIGIN}/save`, `https://example.com/${"x".repeat(4001)}`]) {
    assert.throws(() => buildSaveUrl({ url }));
  }
  assert.equal(new URL(buildSaveUrl({ url: "https://example.com", title: "x".repeat(301) })).searchParams.get("title").length, 300);
});

test("right-click link saves the target without incorrectly using its parent page title", () => {
  const tab = { url: "https://parent.example", title: "Parent" };
  assert.deepEqual(contextSaveInput({ menuItemId: "kivo-save-link", linkUrl: "https://target.example" }, tab), { url: "https://target.example" });
  assert.deepEqual(contextSaveInput({ menuItemId: "kivo-save-page", pageUrl: tab.url }, tab), tab);
  assert.equal(contextSaveInput({ menuItemId: "unknown" }, tab), null);
});

function browserMock() {
  const listeners = {};
  const calls = { tabs: [], menus: [], badges: [], titles: [], removeAll: 0 };
  const event = (name) => ({ addListener: (fn) => { listeners[name] = fn; } });
  const api = {
    runtime: { onInstalled: event("installed") },
    contextMenus: {
      onClicked: event("menu"),
      removeAll: async () => { calls.removeAll++; },
      create: (menu) => { calls.menus.push(menu); },
    },
    action: {
      onClicked: event("action"),
      setBadgeText: async (value) => { calls.badges.push(value); },
      setTitle: async (value) => { calls.titles.push(value); },
      setBadgeBackgroundColor: async () => {},
    },
    storage: { local: { get: async () => ({ appOrigin: DEFAULT_APP_ORIGIN }) } },
    tabs: { create: async (value) => { calls.tabs.push(value); } },
  };
  registerExtension(api);
  return { api, calls, listeners };
}

test("worker installs scoped menus, opens a new tab and does not report a successful database save", async () => {
  const { calls, listeners } = browserMock();
  await listeners.installed();
  assert.equal(calls.removeAll, 1);
  assert.deepEqual(calls.menus.map((menu) => menu.id), ["kivo-save-page", "kivo-save-link"]);
  assert.deepEqual(calls.menus[1].targetUrlPatterns, ["http://*/*", "https://*/*"]);
  await listeners.action({ id: 7, url: "https://example.com/", title: "Example" });
  assert.equal(calls.tabs.length, 1);
  assert.equal(calls.tabs[0].active, true);
  assert.equal(new URL(calls.tabs[0].url).searchParams.get("title"), "Example");
  assert.deepEqual(calls.badges.at(-1), { tabId: 7, text: "" });
  assert.equal(calls.titles.at(-1).title, ACTION_TITLE);
  await listeners.menu({ menuItemId: "kivo-save-link", linkUrl: "https://target.example" }, { id: 7, title: "Parent" });
  assert.equal(new URL(calls.tabs[1].url).searchParams.has("title"), false);
});

test("worker rejects unsupported pages and recovers on the next valid action", async () => {
  const { calls, listeners } = browserMock();
  await listeners.action({ id: 4, url: "chrome://newtab/" });
  assert.equal(calls.tabs.length, 0);
  assert.deepEqual(calls.badges.at(-1), { tabId: 4, text: "!" });
  await listeners.action({ id: 4, url: "https://example.com" });
  assert.equal(calls.tabs.length, 1);
  assert.equal(calls.badges.at(-1).text, "");
});

test("worker handles settings/tab failures and coalesces a rapid double click", async () => {
  const { api, calls, listeners } = browserMock();
  api.storage.local.get = async () => { throw new Error("Settings unavailable"); };
  await listeners.action({ id: 1, url: "https://example.com" });
  assert.equal(calls.tabs.length, 0);
  assert.equal(calls.badges.at(-1).text, "!");
  let finish;
  api.storage.local.get = () => new Promise((resolve) => { finish = resolve; });
  const pending = listeners.action({ id: 1, url: "https://example.com" });
  await listeners.action({ id: 1, url: "https://example.com" });
  finish({ appOrigin: DEFAULT_APP_ORIGIN });
  await pending;
  assert.equal(calls.tabs.length, 1);
  api.storage.local.get = async () => ({ appOrigin: DEFAULT_APP_ORIGIN });
  api.tabs.create = async () => { throw new Error("Could not open tab"); };
  await listeners.action({ id: 1, url: "https://example.com" });
  assert.equal(calls.badges.at(-1).text, "!");
});

test("manifest uses least-privilege MV3 with local worker/options/icons", () => {
  const root = new URL("../extensions/chrome/", import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL("manifest.json", root), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual([...manifest.permissions].sort(), ["activeTab", "contextMenus", "storage"]);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.content_scripts, undefined);
  assert.equal(manifest.background.type, "module");
  assert.equal(manifest.commands._execute_action.suggested_key.default, "Alt+Shift+K");
  for (const file of [manifest.background.service_worker, manifest.options_ui.page, ...Object.values(manifest.icons)]) {
    assert.ok(existsSync(new URL(file, root)), `Missing extension file: ${file}`);
  }
});
