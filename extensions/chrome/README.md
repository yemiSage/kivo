# Kivo Chrome extension — starter

An unpacked Manifest V3 extension for **desktop Chrome**. Click its toolbar icon, press `Alt+Shift+K`, or right-click a page/link to open Kivo's existing save flow in a **new tab**. The page you were viewing is not replaced.

This first version hands a URL to the web app. It is not a standalone library or a background-save API client. Kivo handles login, saving, duplicate detection and organisation. Opening the save tab is **not** confirmation that an item has been saved: check Kivo's success/error state.

## Install locally

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select this `extensions/chrome` folder — the folder containing `manifest.json`, not the repository root.
4. Open Chrome's extensions menu and pin **Kivo — Save for later** to the toolbar.
5. Sign in to Kivo in the **same Chrome profile**. An installed PWA or another browser/profile can have a different session.
6. Visit an ordinary website and click the Kivo icon. A new Kivo tab should open and save the link once signed in. Organise it using the existing save screen.

All required scripts, icons and settings pages are checked in. No extension build, API keys, service-role token or separate Supabase project is needed to use the default hosted Kivo account. Development from source uses the root Node 24/npm toolchain.

This starter has **not been published to the Chrome Web Store** and is not automatically installed by the web app. Managed browsers may prohibit unpacked extensions. Review the source before loading any unpacked extension.

## Actions

| Action | Behaviour |
| --- | --- |
| Toolbar click | Sends the current page URL/title to Kivo's `/save` route in a new tab. |
| `Alt+Shift+K` | Invokes the same toolbar action; configure conflicts at `chrome://extensions/shortcuts`. |
| Right-click → Save page to Kivo | Sends that page URL/title. |
| Right-click link → Save link to Kivo | Sends the target URL, not the containing page's unrelated title. |
| Red `!` badge | Handoff failed or URL is unsupported. Hover the toolbar icon for the reason; retry a supported page to clear the badge. |

HTTP/HTTPS links are supported. Browser pages such as `chrome://`, local files, data/JavaScript URLs, URLs with embedded credentials and URLs over the app's 4000-character limit are rejected. Saving Kivo's own configured origin is also rejected to avoid sending a login/save page back into itself.

Remote image links can be saved as ordinary page/link URLs; this version has no dedicated image-context menu, local-file upload or screenshot capture. It does not download restricted media or read a page's full contents.

## Use a local server or your own deployment

Right-click the Kivo extension icon → **Options**, or open its Details → Extension options. Set the app address to:

- Default: `https://kivo-save.vercel.app`
- Your own HTTPS origin, for example `https://your-kivo.example`
- Local development, for example `http://localhost:5000`

Enter an **origin only**: no path, query, fragment or credentials. Plain HTTP is allowed only on loopback (`localhost`, `127.0.0.1`, `[::1]`). Click **Save settings**; **Use default** resets and saves the hosted address. The setting is device-local, not synced to Chrome accounts.

Only configure an app you trust. This address receives URLs/titles you explicitly choose to save. A self-hosted fork must retain the `/save?url=...&title=...` flow; its operator needs the normal database/Auth setup described in the [root README](../../README.md). For localhost, start the server and configure its callback origin before testing sign-in.

## Permissions and privacy

| Permission | Purpose |
| --- | --- |
| `activeTab` | Temporary access to the current tab's URL/title after your action, rather than all browsing history. |
| `contextMenus` | The page/link right-click actions. |
| `storage` | Store only the configured Kivo origin in `chrome.storage.local`. |

No persistent host permissions, `tabs` history permission, content scripts, cookies permission, remote scripts, analytics or external message handlers are declared. The worker creates a normal web tab; the web app authenticates with its own session. The extension does not store access tokens, passwords, OTPs or saved content. Other extensions and Chrome's own settings have separate privacy behaviour.

The chosen URL/title travels in a navigation query string to your configured Kivo app, which then processes it using its existing backend/providers. URLs can themselves contain sensitive query parameters. Do not save private/token-bearing URLs unless you intend that app/backend to receive them. Browser history, proxies and deployment logs can have separate retention; this extension does not erase them. See [PRIVACY.md](PRIVACY.md).

## Development and validation

From the repository root:

```bash
npm ci
npm run prepare:extension-icons
npm run lint
npm test
npm run typecheck
npx playwright install chromium
npm run test:extension:browser
```

The four PNG icons are mechanically rasterised from `icon.svg`, reusing Kivo's existing PWA bookmark shape. Regeneration is only needed after editing that source. No runtime dependency is bundled into the extension: Playwright and sharp are root development tools only.

The unit tests cover URL encoding, destination validation, unsupported inputs, manifests, worker events, badge recovery, browser failures and rapid double-click coalescing. The optional browser smoke test uses a separate, temporary **headless Chromium profile** and fixture documents; it must never use your real account/profile. It checks extension loading, options validation/persistence/reset, 360px/desktop fit and real storage/tab/badge APIs through captured worker handlers. Native toolbar/context-menu activation and authenticated saves still need manual testing. The runner prints its temporary profile path on success; failures leave an empty/test-only profile for diagnosis.

On this Windows machine, the initial browser smoke run was blocked at browser launch with `spawn UNKNOWN`, before testing extension loading. Unit tests passed; do not describe the extension as installed, fully browser-verified or end-to-end verified on that evidence. Retry on a supported environment after installing Playwright's matching Chromium build. See the [official extension testing guide](https://playwright.dev/docs/chrome-extensions).

After editing files, click **Reload** on the extension's card at `chrome://extensions`. Inspect its service worker from that card for errors. Do not add page URLs/titles/tokens to logs.

### Manual acceptance checklist

- [ ] Unpacked install loads without manifest/worker errors.
- [ ] Pin toolbar icon; save a normal public page and verify Kivo confirms success.
- [ ] Repeat the save and check existing duplicate handling.
- [ ] Right-click a link; verify the target URL is saved, without the parent page title.
- [ ] Right-click a page; verify its page URL/title.
- [ ] Use the keyboard shortcut or resolve a conflict in Chrome's shortcuts settings.
- [ ] Signed-out handoff reaches login and retains the original destination through sign-in.
- [ ] Unsupported pages show `!`, open no save tab and recover on a supported page.
- [ ] Configure localhost/custom HTTPS, restart the worker and verify the setting persists; invalid destinations are rejected.
- [ ] Existing source tabs are not navigated or reloaded.
- [ ] Browser/backend failures are handled by the extension or Kivo without a false “saved” notification.

## Before publishing

Finish the manual/real-account tests, review permission justifications, create accurate screenshots/store copy and publish an operator-controlled privacy policy. Check the current Chrome Web Store requirements and complete its data disclosures; this repo does not submit or pay for a store listing. Increase the manifest version for each release and retain the MIT license and applicable notices.

Possible next iteration: authenticated popup with vault/tag selection and explicit save status. That requires a deliberate authentication/API design; do not put a Supabase service-role key into an extension or copy browser cookies to fake a shared session.

References: [activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab), [context menus](https://developer.chrome.com/docs/extensions/reference/api/contextMenus), [storage](https://developer.chrome.com/docs/extensions/reference/api/storage), [commands](https://developer.chrome.com/docs/extensions/reference/api/commands).
