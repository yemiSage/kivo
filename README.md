# Kivo

Save anything from anywhere, organise it automatically, find it when you need it.
A mobile-first PWA built with Next.js 16, Supabase and Tailwind CSS 4.

## Setup

1. **Create a Supabase project** (free tier is fine).
2. **Run the schema:** paste `supabase/migrations/0001_init.sql` into the SQL editor and run it.
   This creates the tables, RLS policies, search function, default collections trigger and
   a private `media` storage bucket.
3. **Auth settings** (Authentication → URL configuration / Email templates):
   - Site URL: your deployed URL. Add `http://localhost:3000/**` and your Vercel URL `/**` to redirect URLs.
   - Kivo supports both a passwordless link and a 6-digit code so installed iOS PWAs can sign in without sharing Safari's session. In the Magic Link email template, keep the `{{ .ConfirmationURL }}` link and add `{{ .Token }}` where the visible code should appear.
   - Set **Email OTP length** to `6` under Authentication → Sign In / Providers → Email. The form verifies automatically as soon as the sixth digit is entered.
   - Custom SMTP is optional and only needed for branded sender details and higher delivery limits.
4. **Env:** `cp .env.example .env.local` and fill in the Supabase URL + anon key.
   `GEMINI_API_KEY` is optional; without it, categorisation uses the built-in rules.
5. `npm install && npm run dev` → http://localhost:3000

Deploy: import the repo in Vercel and set the same env vars. Share-target testing needs
the HTTPS deployment, see [docs/SHARING.md](docs/SHARING.md).

## What's in the MVP

- **Save:** paste a link (auto-saves on paste), one-tap *Paste & save* from the clipboard,
  image upload, and the Android share sheet (links, text, images).
- **Previews:** server-side Open Graph + oEmbed extraction with SSRF protection,
  handled gracefully when platforms withhold data.
- **Organise:** collections (5 defaults per user), tags, notes, type filters, automatic
  collection suggestions (rules, plus optional Gemini).
- **Find:** full-text + substring search over titles, descriptions, notes, tags and URLs.
- **Accounts:** passwordless email-link or 6-digit-code sign-in, private libraries via Postgres RLS, private storage.
- **PWA:** installable, offline viewing of previously opened pages and images, install prompt.

## Structure

```
src/
  app/
    (app)/             signed-in screens with bottom nav: home, collections, save, search, profile, item
    actions.ts         server actions (save, edit, delete, collections)
    api/metadata/      link preview endpoint (signed-in only)
    share-target/      Web Share Target fallback when the service worker isn't active
    auth/              magic-link callbacks
    icons/[file]/      generated PNG app icons
  components/          UI (SaveScreen is the core flow)
  lib/
    metadata.ts        safe preview extraction
    url.ts             URL extraction, canonicalisation, platform & type detection
    categorize.ts      rule-based + optional Gemini suggestions
    data.ts            queries
    supabase/          browser/server/proxy clients
  proxy.ts             session refresh + auth gate (Next 16's renamed middleware)
public/
  manifest.webmanifest share_target lives here
  sw.js                share handling + offline caching
supabase/migrations/   schema
docs/SHARING.md        Android/iOS share compatibility + test plan
```

## Notes

- Duplicate links are detected by canonical URL (tracking params stripped, `youtu.be` folded into `youtube.com`).
- Semantic search: the migration includes a commented-out pgvector section; `search_items` is the seam to extend.
- The service worker only registers in production builds (`npm run build && npm start`).
