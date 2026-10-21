"use client";

import { useSyncExternalStore } from "react";

export interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
const initial = { available: false, installed: false };

/** Shared across navigation, even if the automatic install hint was dismissed. */
export function createPwaInstallStore(host: Window) {
  let deferred: InstallPromptEvent | null = null;
  const media = host.matchMedia("(display-mode: standalone)");
  let state = { ...initial, installed: media.matches || (host.navigator as Navigator & { standalone?: boolean }).standalone === true };
  const listeners = new Set<() => void>();
  const update = (installed = state.installed) => {
    state = { installed, available: Boolean(deferred) && !installed };
    for (const listener of listeners) listener();
  };
  host.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault(); deferred = event as InstallPromptEvent; update();
  });
  host.addEventListener("appinstalled", () => { deferred = null; update(true); });
  media.addEventListener("change", () => update(media.matches));
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async install() {
      const event = deferred;
      if (!event || state.installed) return false;
      deferred = null; update();
      try { await event.prompt(); const choice = await event.userChoice; if (choice.outcome === "accepted") update(true); return true; }
      catch { return false; }
    },
  };
}
let store: ReturnType<typeof createPwaInstallStore> | undefined;
const subscribe = (listener: () => void) => { store ??= createPwaInstallStore(window); return store.subscribe(listener); };
const getSnapshot = () => store?.getSnapshot() ?? initial;
const getServerSnapshot = () => initial;

export function usePwaInstall() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { ...state, install: () => store?.install() ?? Promise.resolve(false) };
}
