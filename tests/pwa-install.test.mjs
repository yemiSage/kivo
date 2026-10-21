import assert from "node:assert/strict";
import test from "node:test";
import { createPwaInstallStore } from "../src/lib/pwa-install.ts";

function fixture(installed = false) {
  const host = new EventTarget();
  const media = new EventTarget();
  media.matches = installed;
  host.matchMedia = () => media;
  host.navigator = {};
  const store = createPwaInstallStore(host);
  function prompt(outcome = "dismissed", fails = false) {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    let calls = 0;
    event.prompt = async () => { calls++; if (fails) throw new Error("Unavailable"); };
    event.userChoice = Promise.resolve({ outcome });
    host.dispatchEvent(event);
    return { event, calls: () => calls };
  }
  return { host, media, store, prompt };
}

test("PWA prompt survives subscribers leaving and can only be consumed once", async () => {
  const { store, prompt } = fixture();
  const unsubscribe = store.subscribe(() => {});
  const native = prompt();
  assert.equal(native.event.defaultPrevented, true);
  unsubscribe(); // The automatic hint may dismiss while Profile mounts later.
  assert.equal(store.getSnapshot().available, true);
  assert.equal(await store.install(), true);
  assert.equal(await store.install(), false);
  assert.equal(native.calls(), 1);
  assert.deepEqual(store.getSnapshot(), { installed: false, available: false });
});

test("accepted and standalone installations update all subscribers", async () => {
  const { store, host, prompt } = fixture();
  let updates = 0;
  store.subscribe(() => updates++);
  prompt("accepted");
  await store.install();
  assert.equal(store.getSnapshot().installed, true);
  assert.ok(updates > 0);
  host.dispatchEvent(new Event("appinstalled"));
  assert.equal(store.getSnapshot().available, false);
  assert.equal(fixture(true).store.getSnapshot().installed, true);
});

test("unavailable native prompts fall back to manual installation", async () => {
  const { store, prompt } = fixture();
  assert.equal(await store.install(), false);
  prompt("dismissed", true);
  assert.equal(await store.install(), false);
  assert.equal(store.getSnapshot().available, false);
});
