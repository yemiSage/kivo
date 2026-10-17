import { ACTION_TITLE, DEFAULT_APP_ORIGIN, buildSaveUrl, contextSaveInput } from "./save-url.mjs";

/** Injectable browser API keeps event handling testable without real accounts or saved content. */
export function registerExtension(api) {
  async function setAction(tabId, error = "") {
    const scope = Number.isInteger(tabId) && tabId >= 0 ? { tabId } : {};
    await Promise.all([
      api.action.setBadgeText({ ...scope, text: error ? "!" : "" }),
      api.action.setTitle({ ...scope, title: error ? `Kivo: ${error}` : ACTION_TITLE }),
      ...(error ? [api.action.setBadgeBackgroundColor({ ...scope, color: "#b42318" })] : []),
    ]);
  }

  let opening = false;
  async function openSave(input, tabId) {
    // Coalesce rapid double clicks while the handoff is being created. This is not a save receipt.
    if (opening) return;
    opening = true;
    try {
      const settings = await api.storage.local.get({ appOrigin: DEFAULT_APP_ORIGIN });
      const url = buildSaveUrl({ ...input, appOrigin: settings.appOrigin });
      await api.tabs.create({ url, active: true });
      await setAction(tabId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not open Kivo. Try again.";
      // Do not log the source URL, page title or user content.
      await setAction(tabId, message).catch(() => {});
    } finally {
      opening = false;
    }
  }

  api.runtime.onInstalled.addListener(async () => {
    try {
      await api.contextMenus.removeAll();
      api.contextMenus.create({
        id: "kivo-save-page", title: "Save page to Kivo", contexts: ["page"],
        documentUrlPatterns: ["http://*/*", "https://*/*"],
      });
      api.contextMenus.create({
        id: "kivo-save-link", title: "Save link to Kivo", contexts: ["link"],
        targetUrlPatterns: ["http://*/*", "https://*/*"],
        documentUrlPatterns: ["http://*/*", "https://*/*"],
      });
    } catch {
      await setAction(undefined, "Could not set up the menus. Reload the extension.").catch(() => {});
    }
  });
  api.action.onClicked.addListener((tab) => openSave({ url: tab.url, title: tab.title }, tab.id));
  api.contextMenus.onClicked.addListener((info, tab) => {
    const input = contextSaveInput(info, tab);
    if (input) return openSave(input, tab?.id);
  });
}

// No persistent credentials, content scripts, cookies or access to every visited tab.
if (typeof chrome !== "undefined" && chrome.runtime?.id) registerExtension(chrome);
