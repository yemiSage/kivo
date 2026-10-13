# Receiving shared content: platform compatibility

Two different APIs, easy to confuse:

| API | Direction | Used by Kivo for |
| --- | --- | --- |
| **Web Share API** (`navigator.share`) | Sharing *out of* a web page | "Share" button on an item page |
| **Web Share Target API** (`share_target` in the manifest) | Receiving *into* an installed PWA | Appearing in the OS share sheet |

## Support matrix

| Platform | Kivo in share sheet? | How users save |
| --- | --- | --- |
| Android, Chrome / Edge / Samsung Internet, **installed** PWA | ✅ Yes (links, text, images) | Share → Kivo → saved instantly |
| Android, not installed | ❌ | Copy link → Kivo → Paste & save |
| iOS / iPadOS (any browser; all use WebKit) | ❌ Not supported by Safari | Share → Copy Link → Kivo → Paste & save |
| Desktop Chrome/Edge (installed, Windows/ChromeOS) | ⚠️ Partial, varies by OS | Paste link in Save tab |
| Desktop Safari / Firefox | ❌ | Paste link in Save tab |

**iOS does not support Web Share Target.** Adding Kivo to the Home Screen gives
an app-like icon and standalone window, but it will never appear in the iOS share
sheet. The only way to get there is a native **Share Extension**, which requires a
native iOS app (see "Future: native companions" below).

## How it works in Kivo

1. `public/manifest.webmanifest` declares a `POST multipart/form-data` share target
   at `/share-target` with `title`, `text`, `url` and image `files` (field `media`).
2. `public/sw.js` intercepts that POST, stashes any images in Cache Storage
   (`/__share/0…`) and redirects to `/save?url=…&text=…&files=N&source=share`.
3. `/save` (`SaveScreen`) extracts the first URL from `url` **or** `text`
   (Instagram, TikTok and X put the link inside `text`), and **saves immediately**
   with no further taps. The user can then move it to a collection or add tags.
4. If the service worker isn't active yet (e.g. first launch right after install),
   `src/app/share-target/route.ts` handles the POST instead: links/text still
   work, images are dropped with a message asking the user to share again.
5. If the user is signed out, the share parameters are carried through `/login?next=…`
   and the save happens right after sign-in.

## iOS fallback (implemented)

- Save tab → **Paste & save**: one tap reads the clipboard and saves.
- Pasting into the link field saves straight away (paste = intent).
- Contextual instructions on the Save and Profile screens per platform.
- Sign-in uses a 6-digit email code, not only a magic link: an installed iOS PWA has
  storage separate from Safari, so a magic link would sign in Safari, not the app.
  **Configure the Supabase "Magic Link" email template to include `{{ .Token }}`.**
- The manifest asks supported platforms to open in-scope email links in the installed
  Kivo window. Android WebAPK installations support this; iOS does not, which is why
  the code entry remains the reliable cross-platform path.

## Testing on real devices

Share target requires HTTPS and an installed PWA, so test on a deployed URL
(Vercel preview) rather than localhost:

1. Android: open the site in Chrome → menu → *Install app*. Open Instagram/TikTok/X/Chrome,
   tap Share, pick Kivo. Repeat with an image from Photos/Gallery.
   - After changing the manifest, uninstall and reinstall: Android caches share targets.
   - Debug via `chrome://inspect` → your device → the Kivo webview.
2. iOS: Safari → Share → *Add to Home Screen*. Confirm Kivo is **not** in the share sheet
   (expected), then test Copy Link → Kivo → Paste & save. iOS shows a paste-permission
   prompt on the first clipboard read; that is OS behaviour.

Checklist per platform: link only; text containing a link; image only; image + caption;
signed-out share; offline share (should show the offline page, then work on retry).

## What metadata we can get (tested Oct 2026)

Server-side extraction (`src/lib/metadata.ts`) reads Open Graph/Twitter Card tags and
official, token-free oEmbed endpoints only. No scraping behind logins, no media download.

| Source | Result |
| --- | --- |
| YouTube, Vimeo, Pinterest, X | Full (title, author, thumbnail) via oEmbed |
| Reddit | Title + author |
| News sites, blogs, docs, shops | Usually full via Open Graph |
| TikTok | Varies; oEmbed works for many public videos |
| Instagram, Facebook | Usually **none**: their oEmbed needs a Meta app token and review. Saved with the URL and a "limited preview" note |

To improve Instagram/Facebook later: register a Meta app, pass App Review for
`oEmbed Read`, and add the endpoint with a server-side token in `OEMBED`.

## Future: native companions

The architecture keeps everything a native app needs behind Supabase (Postgres + RLS +
Storage), so native clients can share the same backend:

- **Android**: wrap the PWA as a Trusted Web Activity (Bubblewrap / PWABuilder) to ship
  an APK/Play listing; the manifest share target carries over.
- **iOS**: a small native app (or Capacitor shell) with a **Share Extension** that posts
  the shared URL to Supabase using the user's session, stored in a shared App Group keychain.
  This is the only route into the iOS share sheet.
