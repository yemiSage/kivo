import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { deferUntilIdle } from "../src/lib/defer-until-idle.ts";

function scheduler() {
  const pending = {};
  const host = {
    addEventListener: (_name, fn) => { pending.load = fn; },
    removeEventListener: () => { delete pending.load; },
    requestIdleCallback: (fn, options) => { pending.idle = fn; pending.options = options; return 1; },
    cancelIdleCallback: () => { delete pending.idle; },
    setTimeout: (fn) => { pending.timer = fn; return 2; },
    clearTimeout: () => { delete pending.timer; },
  };
  return { host, pending };
}

test("optional worker registration waits for document load then idle, without a fixed splash delay", () => {
  const { host, pending } = scheduler();
  let calls = 0;
  deferUntilIdle(() => calls++, host, false);
  assert.equal(calls, 0);
  assert.equal(pending.idle, undefined);
  pending.load();
  assert.equal(pending.options.timeout, 1500);
  assert.equal(calls, 0);
  pending.idle();
  assert.equal(calls, 1);
});

test("worker registration scheduling supports cancellation and browsers without idle callbacks", () => {
  const { host, pending } = scheduler();
  let calls = 0;
  const cancel = deferUntilIdle(() => calls++, host, true);
  const alreadyQueued = pending.idle;
  cancel();
  alreadyQueued();
  assert.equal(calls, 0);
  delete host.requestIdleCallback;
  const cancelFallback = deferUntilIdle(() => calls++, host, true);
  assert.ok(pending.timer);
  cancelFallback();
  assert.equal(pending.timer, undefined);
  const cancelBeforeLoad = deferUntilIdle(() => calls++, host, false);
  cancelBeforeLoad();
  assert.equal(pending.load, undefined);
});

function publicResponse(body = "public launch", options = {}) {
  const response = new Response(body, { headers: { "content-type": "text/html" }, ...options });
  Object.defineProperty(response, "type", { value: "basic" });
  return response;
}

function workerHarness() {
  const listeners = {};
  const stores = new Map();
  const calls = { fetch: 0, deleted: [] };
  const key = (request) => typeof request === "string" ? new URL(request, "https://kivo.test").href : request.url;
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (name) => { calls.deleted.push(name); return stores.delete(name); },
    open: async (name) => {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return {
        match: async (request) => store.get(key(request))?.clone(),
        put: async (request, response) => {
          if (calls.writeFails) throw new Error("quota exceeded");
          store.set(key(request), response.clone());
        },
        keys: async () => [...store.keys()].map((url) => ({ url })),
        delete: async (request) => store.delete(key(request)),
        addAll: async (requests) => { for (const request of requests) store.set(key(request), publicResponse()); },
      };
    },
    match: async (request) => {
      for (const store of stores.values()) if (store.has(key(request))) return store.get(key(request)).clone();
    },
  };
  const context = vm.createContext({
    self: {
      location: { origin: "https://kivo.test" },
      addEventListener: (name, fn) => { listeners[name] = fn; },
      skipWaiting: async () => {}, clients: { claim: async () => {} },
      registration: { navigationPreload: { enable: async () => {} } },
    },
    caches, URL, URLSearchParams, Response, Set,
    fetch: (...args) => { calls.fetch++; return calls.network(...args); },
  });
  calls.network = async () => publicResponse("fresh");
  vm.runInContext(readFileSync(new URL("../public/sw.js", import.meta.url), "utf8"), context);
  function navigation(path, preloadResponse = Promise.resolve(undefined)) {
    const jobs = [];
    let result;
    listeners.fetch({
      request: { url: `https://kivo.test${path}`, method: "GET", mode: "navigate" },
      preloadResponse,
      respondWith: (promise) => { result = promise; },
      waitUntil: (promise) => { jobs.push(promise); },
    });
    return { result, settle: async () => { await Promise.all(jobs); } };
  }
  return { calls, caches, listeners, stores, navigation };
}

test("legacy splash navigations redirect without fetching or hydrating a splash", async () => {
  const { navigation, calls } = workerHarness();
  for (const path of ["/launch", "/launch?source=pwa", "/launch?preview=1"]) {
    const response = await navigation(path).result;
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "https://kivo.test/");
  }
  assert.equal(calls.fetch, 0);
});

test("private pages do not use the immediate public launch cache; sign-out preserves only public shell", async () => {
  const { caches, calls, listeners, navigation } = workerHarness();
  const shell = await caches.open("kivo-v3-shell");
  const pages = await caches.open("kivo-v3-pages");
  await shell.put("/launch", publicResponse("public"));
  await pages.put("/profile", publicResponse("old private page"));
  assert.equal(await (await navigation("/profile").result).text(), "fresh");
  assert.equal(calls.fetch, 1);
  assert.equal(navigation("/auth/implicit").result, undefined);
  let work;
  listeners.message({ data: "clear-user-cache", waitUntil: (job) => { work = job; } });
  await work;
  assert.equal(await (await shell.match("/launch")).text(), "public");
  assert.deepEqual(calls.deleted.sort(), ["kivo-share-inbox", "kivo-v3-images", "kivo-v3-pages"]);
});

test("old library start URL loads directly and retains filters", async () => {
  const { navigation, calls } = workerHarness();
  for (const path of ["/?source=pwa", "/?source=pwa&kind=image", "/?source=other"]) {
    assert.equal(await (await navigation(path).result).text(), "fresh");
  }
  assert.equal(calls.fetch, 3);
});

test("new installs start directly in the app and legacy server entry redirects", () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  assert.equal(manifest.start_url, "/");
  const page = readFileSync(new URL("../src/app/launch/page.tsx", import.meta.url), "utf8");
  assert.ok(page.includes('redirect("/")'));
  assert.ok(!page.includes("LaunchRedirect"));
});
