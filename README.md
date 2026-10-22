# Kivo

Save links and images, organise them in private or shared vaults, and find them through live, categorised search. Kivo is a mobile-first progressive web app built with Next.js, React, TypeScript, Supabase and Tailwind CSS.

The code is available under the [MIT License](LICENSE). Preserve the license and applicable [third-party notices](THIRD_PARTY_NOTICES.md) when redistributing it. A clone uses **your own Supabase project and credentials**; it does not include the maintainers' hosted users, files, email configuration or deployment access.

Start with this README, then read [CONTRIBUTING.md](CONTRIBUTING.md) to contribute and [SECURITY.md](SECURITY.md) to report a vulnerability. The [readiness review](docs/OPEN_SOURCE_READINESS.md) records checks, operational limits and remaining work. Public source availability is not a guarantee that an unrestricted public deployment is production-hardened.

## Contents

- [Features and current limits](#features-and-current-limits)
- [Discoverability](#discoverability)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Database setup](#database-setup)
- [Authentication and email](#authentication-and-email)
- [Environment variables](#environment-variables)
- [Optional integrations](#optional-integrations)
- [Development commands](#development-commands)
- [Project structure](#project-structure)
- [Search behaviour](#search-behaviour)
- [Uploads and storage](#uploads-and-storage)
- [PWA, offline behaviour and sharing](#pwa-offline-behaviour-and-sharing)
- [Chrome extension starter](#chrome-extension-starter)
- [Deployment and updates](#deployment-and-updates)
- [Security and privacy](#security-and-privacy)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing and contributors](#contributing-and-contributors)
- [License, assets and attribution](#license-assets-and-attribution)
- [Maintainer release checklist](#maintainer-release-checklist)

## Features and current limits

| Area | Implemented behaviour |
| --- | --- |
| Accounts | Passwordless email link and six-digit OTP; verification starts when digit six is entered. |
| Saving | Paste a URL, use Paste & save, upload an image, or receive shared content on supported installed PWAs. Pasting/sharing a valid URL can save it immediately. |
| Previews | Open Graph, Twitter Card metadata and selected public oEmbed endpoints. Restricted sites can produce partial previews. |
| Organisation | Vaults, tags, notes, editable titles/types, rule-based and optional AI collection suggestions. |
| Shared vaults | Owner-created link/email invites, memberships, email binding, one-use tokens and expiry. Members can edit and remove shared items. |
| Finding content | Modal search grouped into Tags, Vaults, Files, Links, Videos, Images and Settings. |
| Images | Cropped mobile previews, full-screen viewing and desktop focal-point adjustment. |
| Mobile layout | Edge-to-edge signed-in shell, in-shell bottom navigation and safe areas; scenic background on authentication screens. |
| Offline | Best-effort caching of previously visited documents/images and an offline fallback. |
| Chrome extension | Unpacked desktop MV3 starter: toolbar, shortcut and page/link context-menu handoff to the existing save screen. Not a published store release. |
| Administration | Optional server-protected dashboard for account and storage metrics. |

Current boundaries:

- **Uploads are images only.** Saved links may point to PDFs, other documents or videos; this does not add arbitrary document/video uploads or video downloading.
- Library and vault views currently return up to 120 items; cursor pagination is not implemented.
- Search previews are capped, and tags are derived from the matched-item window rather than an independent complete tag index.
- Settings results open the existing account/privacy/sign-out sections. There is no separate full preferences page.
- Device-only saves, a general offline write queue, conflict resolution, end-to-end encryption, billing, native apps and account export/deletion screens are not implemented.
- Builds/deployments do not automatically apply database migrations or configure Supabase Auth/SMTP.

## Requirements

| Requirement | Details |
| --- | --- |
| Node.js | **24.x**, matching `.nvmrc`, `.node-version` and `package.json`. Tests use native TypeScript stripping. |
| npm | Use the version bundled with Node 24. Commit and respect `package-lock.json`. |
| Git | Required for cloning/contributing and the repository secret-pattern checks. |
| Supabase | A separate project with Auth, Postgres and Storage. The hosted SQL Editor setup below needs no Docker installation. |
| Browser | A modern browser; installation, clipboard and incoming sharing vary by platform. |
| Hosting | A Node-compatible Next.js host, such as Vercel. Static-only hosting is insufficient. |

The current stack uses Next.js 16, React 19, TypeScript 7, Tailwind CSS 4, Supabase JS/SSR, Radix UI, Iconsax, Geist, Biome and sharp. Exact resolved versions live in the lockfile.

`"private": true` in `package.json` prevents accidental npm publication. It does not control GitHub visibility or prevent use under MIT.

## Quick start

### 1. Clone or fork

For exploration or your own deployment:

```bash
git clone https://github.com/yemiSage/kivo.git
cd kivo
npm ci
```

For contributions, create a GitHub fork and clone it instead:

```bash
git clone https://github.com/YOUR-USERNAME/kivo.git
cd kivo
git remote add upstream https://github.com/yemiSage/kivo.git
npm ci
git switch -c codex/describe-your-change
```

Replace `YOUR-USERNAME` with your account. Use your own backend/test data, not the upstream production service.

### 2. Create your Supabase project

Create a project you control and keep its database password private. Obtain its **Project URL** and **public anon/publishable API key**. The browser key is not the service-role key.

Apply every migration in [Database setup](#database-setup) **before creating your first app account**, so the signup trigger creates default vaults.

### 3. Configure your environment

In a fresh clone, copy the example once. Do not overwrite an existing local configuration.

macOS/Linux:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLIC-ANON-OR-PUBLISHABLE-KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Leave the optional admin, Brevo and Gemini values blank initially. Real `.env` files are ignored by Git. Never prefix privileged keys with `NEXT_PUBLIC_`.

### 4. Configure sign-in

Complete [Authentication and email](#authentication-and-email): allow your callback URLs, configure the visible token in the email template and set **OTP length to 6**. These hosted settings are not installed by the SQL migrations.

### 5. Run locally

```bash
npm run dev
```

Open <http://localhost:3000>, sign in with a test email you control, then save a URL and a small image.

For another port:

```bash
npm run dev -- -p 5000
```

Also set `NEXT_PUBLIC_SITE_URL=http://localhost:5000`, add that origin to Supabase's redirect allowlist and restart. An email opened on a physical phone cannot reach your computer through the phone's `localhost`; use your own HTTPS preview deployment for phone authentication/PWA tests.

The sign-in page can render without configured credentials, but this is not a functional mock backend. Saving, accounts and authenticated search require Supabase.

## Database setup

### Fresh hosted project: SQL Editor

Confirm the dashboard is on your development project. Open **SQL Editor → New query**. Copy and run each **complete file** below in numeric order. Verify success before proceeding.

| Order | File | Installs |
| --- | --- | --- |
| 1 | [0001_init.sql](supabase/migrations/0001_init.sql) | Items/collections, initial RLS, search/indexes, signup defaults, private media bucket and storage policies. |
| 2 | [0002_shared_vaults.sql](supabase/migrations/0002_shared_vaults.sql) | Memberships/invites, access helper, shared policies, search and vault-count RPCs. |
| 3 | [0003_email_vault_invites.sql](supabase/migrations/0003_email_vault_invites.sql) | Recipient email binding and invitation acceptance checks. |
| 4 | [0004_limit_media_uploads_to_5mb.sql](supabase/migrations/0004_limit_media_uploads_to_5mb.sql) | 5 MiB bucket upload limit. |
| 5 | [0005_superadmin_metrics.sql](supabase/migrations/0005_superadmin_metrics.sql) | Service-role-only admin metrics RPCs; can be installed with admin UI disabled. |
| 6 | [0006_lock_item_ownership_and_storage.sql](supabase/migrations/0006_lock_item_ownership_and_storage.sql) | Immutable owner/storage path, update policy and access-helper repair. |
| 7 | [0007_add_image_focal_point.sql](supabase/migrations/0007_add_image_focal_point.sql) | Image position columns and valid ranges. |
| 8 | [0008_check_vault_update_destination.sql](supabase/migrations/0008_check_vault_update_destination.sql) | Destination-vault access check when an item is updated. |

Migrations are ordered and are **not universally rerunnable**. `0001`/`0002` create objects without blanket `IF NOT EXISTS` protection. An “already exists” error requires checking what is already applied, not deleting live tables.

If a file fails, stop and inspect its dependency/error. A missing `public.can_access_vault(uuid)` or `public.vault_memberships` generally means `0002` was not fully applied. `0006` repairs its helper only when the shared-vault table exists; it cannot replace the whole shared-vault migration.

### Existing projects and migration tracking

For the vault-creation fix, apply [0010_fix_vault_creation.sql](supabase/migrations/0010_fix_vault_creation.sql) to projects with shared vaults (`0002`) installed. This lets the owner read a newly inserted vault in the same statement without changing shared-member access. It does not depend on the optional R2 storage migration (`0009`). Deploying the app does not apply this SQL automatically.

Back up the intended project, check its migration ledger and apply **only pending files**. An installation already through `0007` needs `0008`. Pushing code or running `npm run build` does not execute SQL.

Record the project, file name, date and outcome when using the SQL Editor. Manual SQL does not automatically establish the CLI migration ledger. Before switching an existing project to `supabase db push`, reconcile its schema/history using the [official migration guidance](https://supabase.com/docs/guides/deployment/database-migrations).

This repository does not include a complete local `supabase/config.toml`, seed dataset, Docker setup or database integration-test runner. Hosted Supabase is the documented quick start. To adopt local Supabase, create/review CLI configuration, use its local API URL/key and email inbox, and apply these SQL files in order using the [local development guide](https://supabase.com/docs/guides/local-development). Do not reset a shared or production database.

### Data model

- `public.collections`: vault name, owner and creation time.
- `public.items`: URL/upload path, preview metadata, type, vault, tags, notes, timestamps, search vector and image positions.
- `public.vault_memberships`: users with access to shared vaults.
- `public.vault_invites`: one-use tokens, expiry, optional invited email and acceptance state.
- `auth.users`: Supabase-managed accounts; the signup trigger creates default vaults.
- `storage.buckets` / `storage.objects`: private `media` bucket and stored files.

The five defaults for **new users** are Read Later, Design Inspiration, Business Ideas, Recipes and Products. The trigger does not backfill users created before it was installed.

## Authentication and email

### Redirect configuration

In Supabase **Authentication → URL Configuration**:

1. Set **Site URL** to the appropriate app origin, such as `http://localhost:3000` or `https://your-kivo.example`.
2. Add your local/deployed origins and the callback paths you use to **Redirect URLs**.
3. The default email-link flow requests `/auth/implicit?next=...`. Allow that callback and its query string on your own origins. For development, an origin-scoped pattern such as `http://localhost:3000/**` covers it; keep production rules as narrow as practical.
4. Optional PKCE/token-hash flows use `/auth/callback` and `/auth/confirm`; configure those only on your own origins when used.
5. Configure preview/admin origins separately if you sign in there. Do not allow unrelated origins.

See the [redirect URL documentation](https://supabase.com/docs/guides/auth/redirect-urls). These dashboard settings are separate from `.env.local` and the migrations.

### Six-digit OTP and template

Enable the Email provider and allow new-user signup if self-registration is intended. Set **Email OTP length to 6**. Choose its expiry in the same provider configuration. Editing template text alone does not change token length.

In the **Magic Link / OTP** email template:

```html
<h2>Sign in to Kivo</h2>
<p>Your Kivo sign-in code:</p>
<p><strong>{{ .Token }}</strong></p>
<p>Enter this code in the app where you requested it.</p>
<p>Or <a href="{{ .ConfirmationURL }}">sign in to Kivo</a>.</p>
<p>If you did not request this email, you can ignore it.</p>
```

Do not hard-code a code, add a second empty token-hash link or promise a five-minute expiry unless configured. If the project sends new users a different signup-confirmation template, test that email and ensure its code/link flow works too. Request a **new** email after changes: existing messages and consumed links do not update.

Installed PWAs can have separate storage from the browser opening an email. Request a code in the installed Kivo window and enter it there. A link signing in the browser does not necessarily sign in the installed app.

Supabase's development email service has restrictions and rate limits. For real-user delivery, configure custom SMTP in Supabase. The Brevo HTTP integration below sends vault invitations; it does not configure Supabase Auth SMTP. See [email authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless) and [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Environment variables

Use `.env.local` locally and your hosting provider's secret/environment settings when deployed. Restart after local changes. **Rebuild** after changing a `NEXT_PUBLIC_` variable: it is embedded in browser assets.

| Variable | Required? | Meaning |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Core app | Your Supabase Project URL; also sets the allowed uploaded-image optimisation host. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Core app | Matching public anon/publishable API key. RLS provides access control. Never use a service-role/secret key here. |
| `NEXT_PUBLIC_SITE_URL` | Configure per deployment | Canonical public origin for metadata, sitemaps and server-built vault invite URLs. Defaults to `http://localhost:3000` in local development; production builds reject loopback as a canonical origin. Default sign-in links use the requesting browser origin. |
| `SUPERADMIN_EMAILS` | Optional admin | Comma-separated exact admin email allowlist. Blank denies all superadmin access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional admin | Server-only privileged metrics key; bypasses RLS. Ordinary saving/search does not need it. |
| `SUPABASE_STORAGE_QUOTA_GB` | Optional admin | Display capacity, default `1`; set your actual allowance. Does not enforce limits or determine your provider plan. |
| `ADMIN_HOST` | Optional admin | Hostname only, e.g. `admin.example.com`; redirects that host's `/` to `/admin` before page matching. Blank uses upstream `adminkivo-save.vercel.app`. `/admin` also works directly for authorised accounts. |
| `BREVO_API_KEY` | Optional invite email | Server-only Brevo transactional API key. |
| `KIVO_FROM_EMAIL` | Optional invite email | Brevo-verified sender; required alongside the key for sending invite emails. |
| `GEMINI_API_KEY` | Optional AI | Server-only key; leave blank for rule-based classification. |
| `GEMINI_MODEL` | Optional AI | Supported model in your own Google project; code defaults to `gemini-2.5-flash`. Change it if that model is unavailable. |

The framework manages `NODE_ENV`. Do not make server credentials public to access them from a component. `.env.example` is a template, never the place to store real values.

## Optional integrations

### Brevo invitations

Verify your own sender/domain in Brevo. Configure `BREVO_API_KEY`, `KIVO_FROM_EMAIL` and the deployed `NEXT_PUBLIC_SITE_URL`; apply `0002`/`0003`. Test with an email address you control.

Email invites bind acceptance to the invited email. Link invites can be accepted by a signed-in user with the token. Both expire after seven days and are one-use. Link creation works without Brevo; actual email sending does not. A failed email send attempts to remove the just-created invite. Never post real invite tokens in issues/screenshots.

### Gemini suggestions

When enabled, Kivo sends the item's title, shortened description, source URL/site and existing collection names to Google's API. The request has a four-second timeout, accepts only an existing collection name and falls back to built-in rules. Collection suggestions never create arbitrary vaults.

This integration can incur provider charges. Explain the external processing in your deployed service's privacy notice and monitor your own API usage. Leave the key blank to disable it.

### Superadmin

Apply `0005` (metrics) and `0010` (storage management), set `SUPERADMIN_EMAILS` and `SUPABASE_SERVICE_ROLE_KEY`, sign in as an allowlisted account and open `/admin`. Ordinary users receive a not-found response. Metrics include personal account identifiers and activity/storage counts; protect screenshots and logs.

For a dedicated admin hostname, attach it to the deployment, set `ADMIN_HOST`, allow its auth callback and test sign-in there. Separate origins do not automatically share a session. The admin login returns to `/admin`, and `Open Kivo` opens the separate main app at `https://kivo-save.vercel.app/`.

Admin quota values are display-only. Billing, enforced per-user quotas and automated object cleanup are not implemented.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Reproducible fresh installation from the lockfile. |
| `npm run dev` | Development server on default port 3000. |
| `npm run dev -- -p 5000` | Development on another port. |
| `npm run lint` | Explicit Biome correctness rules in `biome.json`; not a full style/accessibility audit. |
| `npm run typecheck` | TypeScript check without emitted app code. |
| `npm test` | Credential-free search, redirect and cache regression tests. |
| `npm run test:extension:browser` | Isolated Chromium extension smoke test; install matching Chromium with `npx playwright install chromium` first. No real accounts/saves. |
| `npm run build` | Production build; does not apply SQL or verify email delivery. |
| `npm start` | Serve an existing production build. |
| `npm start -- -p 5000` | Serve it on another port. |
| `npm run check:docs` | Check local Markdown link paths; does not fetch external links or validate anchors. |
| `npm run check:secrets` | Redacted credential-pattern scan of tracked/non-ignored working files. |
| `npm run check:secrets:history` | Also check reachable history blobs on local Git refs. |
| `npm run prepare:background -- /path/to/generated-image.png` | Generate the optimised WebP from an input image. Refuses an existing output unless `--force` is passed. |
| `npm run prepare:extension-icons` | Rasterise the existing bookmark SVG into the extension's PNG sizes. |
| `npm run prepare:extension-download` | Rebuild the allowlisted extension ZIP served by the desktop Profile download button. Run after changing extension files. |
| `npm audit` | Current dependency advisories; results change over time. |

Before a PR:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check:docs
npm run check:secrets
git diff --check
```

Use `npm install` only for intentional dependency changes, reviewing and committing both manifest and lockfile. Do not run `npm audit fix --force` without reviewing breaking changes. A Node warning about module-type detection during direct `.ts` tests is informational; changing the whole package module type solely to hide it requires a separate toolchain review.

## Project structure

```text
.github/                 CI and contribution templates
docs/                    Sharing, asset provenance and readiness review
scripts/                 Secret-pattern checks and background conversion
src/
  app/
    (app)/               Signed-in library, vaults, save, profile, item and invite screens
    actions.ts           Authenticated mutations
    api/metadata/        Signed-in link preview endpoint
    api/search/          Signed-in grouped search endpoint
    auth/                Implicit, PKCE, token-hash callbacks and session-cookie bridge
    admin/               Optional protected metrics dashboard
    icons/[file]/        Generated PWA icons
    login/               Passwordless login
    offline/             Offline fallback
    share-target/        Server fallback for received shares
    globals.css          Theme, shell, responsive rules and motion
  components/            App UI and adapted Radix primitives
  lib/
    admin.ts             Allowlist and privileged metrics
    categorize.ts        Rules and optional Gemini suggestions
    data.ts              RLS-scoped queries and private image URLs
    email.ts             Brevo invite emails
    image-upload.ts      Browser resizing/encoding
    metadata.ts          Public preview fetching/parsing and host checks
    safe-next.ts         Same-origin auth redirects
    search.ts            Result groups and settings destinations
    signed-url-cache.ts  Bounded expiring URL cache
    supabase/            Browser/server/proxy clients
    types.ts             Domain types
    url.ts               URL extraction/canonicalisation/platform detection
  proxy.ts               Session refresh and auth gate
supabase/migrations/     Ordered schema and policy SQL
tests/                   Unit/regression tests
public/                  Manifest, worker and original generated background
```

Normal operations use the caller's session and Supabase RLS. The optional admin service-role client is created only after an allowlist check. Use `getBrowserSupabase` in browser components and server helpers for server code; do not import admin modules into clients.

Authentication is checked at the data/action boundary as well as in the proxy. The sidebar and content can stream independently; signed URLs have a session-specific short cache, and intent-based links avoid eagerly fetching every card destination.

Read [AGENTS.md](AGENTS.md) and the installed `node_modules/next/dist/docs/` before framework edits. This is the App Router with Next.js 16's `proxy.ts` conventions, not an older Pages Router tutorial.

## Search behaviour

The modal debounces requests to `GET /api/search?q=...` and cancels superseded browser requests. Groups appear in this order:

| Group | Matches and destination |
| --- | --- |
| Tags | Matching tags derived from the item search window; opens `/?tag=...`. Not a complete independent tag index. |
| Vaults | Visible vault names; opens that vault. |
| Files | Uploaded non-media references or supported document/archive links, including `.pdf`, `.docx`, `.csv`, `.zip`. Does not add document uploads. |
| Links | Ordinary links, articles and social posts; opens item details. |
| Videos | Video-classified items; opens item details. |
| Images | Image-classified items, including image uploads; opens item details. |
| Settings | Existing Profile account/privacy/sign-out sections. A sign-out result navigates, not logs out automatically. |

The backend considers at most 120 matched items, keeps up to six per item group, six tags and six vaults, and signs only selected images. Counts describe displayed results, not total matches. Empty groups are hidden. Queries use the requesting session and RLS.

Tag filters survive type-filter changes and can be cleared. Keyboard support includes arrows, Enter and Escape. The result panel is 12px below the search bar. There is no `/search` page; installed shortcuts use `/?search=1` to open the modal.

## Uploads and storage

Browser processing attempts to resize large decodable images to a maximum 1920px edge and encode WebP at quality 0.82, retrying at 0.68 if needed. Images already within the dimension cap and at/below 1 MiB can stay unchanged; GIFs skip conversion to retain animation. If conversion fails, an original at/below the limit can be attempted.

The frontend and bucket enforce **5 MiB = 5,242,880 bytes** per accepted upload. MIME types are in `0001`; browser decoding/preview support varies, especially HEIC/HEIF. Convert to JPEG/WebP if necessary.

Objects use `<user-id>/<random-uuid>.<extension>`. Item updates cannot change ownership/storage path. Deleting a vault keeps items and clears `collection_id`.

Private uploads are served with six-hour signed URLs. A bounded server-memory cache reuses URLs for five minutes within the access-token scope after RLS-authorised reads. It is not a durable or cross-instance database. Uploaded thumbnails can be resized through Next.js; arbitrary preview hosts use direct images. Full-screen views retain the source, and transformations have a direct-source fallback.

Signed URLs are bearer links. CDN/browser/offline copies have separate lifetimes; expiry does not erase downloaded bytes. Do not publish them in reports.

Cloud uploads consume your own Supabase allowance. Browser caching does **not** remove the original object. Device-only saves are not implemented. Before scaling an open signup service, add per-user quotas, usage alerts and safe retention/orphan reconciliation. A shared member's item deletion can leave an owner-scoped storage object; failed upload/database-write sequences can also leave orphans. Do not clean storage from an incomplete client list.

## PWA, offline behaviour and sharing

The service worker registers only in production builds:

```bash
npm run build
npm start
```

Choose another port if development already occupies the default. Use an HTTPS deployment for phone installation, clipboard and share-target tests; ordinary LAN HTTP is not equivalent to a secure installed PWA.

Installed launches open the library directly. Older `/launch` start URLs redirect before splash hydration. Main navigation uses automatic route prefetching; item cards retain intent-based prefetching. Search loads on first opening, and optional worker registration runs after load/idle. See [PWA startup](docs/PWA_STARTUP.md) for update and verification details.

- Installed Android Chromium-based PWAs can receive supported link/text/image shares where Web Share Target is available.
- Platforms without incoming share support use Copy Link → Kivo → Paste & save. Outgoing `navigator.share` is a separate capability.
- Before worker activation, the server fallback retains links/text but cannot retain received files through the worker inbox; it gives a retry notice.
- The worker caches previously visited documents/images on a best-effort basis. Auth callbacks are excluded from document caching; sign-out requests user-cache clearing.
- Offline copies are local device data, not encrypted/permanent backup. There is no general offline write queue; retry failed saves when connectivity returns.
- Manifest changes can require reinstalling the PWA to refresh OS shortcuts/share registration.

See [docs/SHARING.md](docs/SHARING.md) for platform notes and real-device tests. Browser support changes: verify your target devices instead of assuming universal compatibility.

## Chrome extension starter

The desktop extension is in [extensions/chrome](extensions/chrome/README.md). Load that folder with **Load unpacked** at `chrome://extensions`, then pin its icon. Toolbar click, `Alt+Shift+K` and page/link right-click actions open the existing Kivo save flow in a new tab. Sign in through the web app in the same Chrome profile. The extension's Options page can target a trusted self-hosted HTTPS origin or localhost for development.

Profile offers **Download Chrome extension** at the existing desktop breakpoint (`md`, 768px and up), with a ZIP and unpacked installation steps. Below that breakpoint it offers **Download PWA**, using the retained browser install prompt where supported and Safari/Chrome home-screen instructions otherwise. The automatic install hint can be dismissed without disabling this settings action.

The starter stores no database credentials and has no persistent access to all websites. Opening a tab is not a save receipt; Kivo confirms success/failure. It is not published to the Chrome Web Store. Read its setup, [privacy notes](extensions/chrome/PRIVACY.md), validation limits and manual acceptance checklist before use. A full authenticated vault/tag popup is future work, not included in this handoff-only version.

## Deployment and updates

### Vercel

1. Import your fork into your own project, using the repository root and Node 24.
2. Configure your own public Supabase values and `NEXT_PUBLIC_SITE_URL`; add optional server secrets only when their features are used.
3. Apply migrations to the **matching** Supabase project before exposing dependent features.
4. Configure auth callbacks, the code/link template and your own SMTP delivery.
5. Build/deploy with `npm run build` and the host's standard Next.js configuration.
6. Verify new signup, existing login, six-digit verification, upload, vault sharing, sign-out and the installed PWA on the deployed origin.
7. Test policy isolation with separate test accounts. A build cannot verify hosted RLS or SMTP.

Use separate development/staging backends where possible. Never expose production service-role/email credentials to untrusted PR or fork builds. Do not deploy this repository's placeholder environment values as a shared backend.

### Other Node hosts

Run `npm ci`, `npm run build`, then `npm start` behind your host's HTTPS reverse proxy; pass `-p PORT` when needed. Preserve the correct origin for redirects, cookies and session checks. Supply build-time public values and runtime server secrets, plus the platform's native Next.js/sharp dependencies.

Static export alone cannot run the server actions, auth, preview fetcher, search or image optimiser. This repository does not include a production Dockerfile or infrastructure-as-code setup.

### Updates

Back up data, inspect pending SQL, apply migrations in order, install from the lockfile, validate, deploy the matching application revision and test existing users. Preserve credentials outside Git. Worker changes should intentionally version caches and test installed clients as well as clean browsers.

Local source, GitHub `main`, hosted database and the active deployment can differ. Verify each separately; a code push is not evidence of a database migration or completed deployment.

## Security and privacy

Read [SECURITY.md](SECURITY.md) and the [readiness report](docs/OPEN_SOURCE_READINESS.md). Existing controls include RLS, verified sessions, private storage, same-origin session requests, safe relative redirects, metadata host/IP checks, restricted thumbnail hosts and server-only admin keys. This review is not a penetration test.

Public-service operators must add suitable rate limiting, provider quotas, abuse monitoring, backups and outbound-network controls. Preview DNS validation currently occurs before a separate connection resolution; DNS pinning is not implemented. Use network-level egress controls or a pinned transport before deploying inside a sensitive/private network.

The app talks to Supabase, requested preview sites/public oEmbed providers, Brevo for invite delivery and Google when Gemini is enabled. Publish your own privacy/retention notice. There is no configured analytics/telemetry product or complete user export/deletion UI in this repository.

The credential scanner detects selected token/private-key formats and service-role JWTs. It does not detect every generic secret, personal image or identifier. History mode covers reachable local refs, not deleted remote refs, GitHub artifacts, external logs or deployed secrets. Rotate exposed credentials at their provider; a new deletion commit cannot remove historical copies.

## Testing

The public landing page is at `/welcome`. Signed-out visits to `/` go there; signed-in visits keep the library. With the development server running, `npm run test:landing:browser` checks its fixed-screen sections, responsive layouts, keyboard controls, reduced motion, and protected save redirects without an account or backend writes.

## Discoverability

Public discovery is intentionally limited to the maintained welcome, FAQ, contact and policy pages. The application generates `/robots.txt`, `/sitemap.xml`, `/llms.txt`, canonical metadata, JSON-LD and social-preview metadata while private account, collection, item, profile, save, invitation, admin and API routes remain non-indexable. Run `npm run build` before `npm run test:discoverability:production` to validate the rendered production output.

Architecture, security boundaries, implementation details, provider dependencies and the evidence-based decisions not to publish the internal API or add an agent protocol server are documented in [the discoverability audit](docs/discoverability/DISCOVERABILITY_AUDIT.md) and [handover](docs/discoverability/HANDOVER.md).

The linked legal pages are `/welcome/privacy` and `/welcome/terms`. Their operator is MaestroTG, Lagos, Nigeria, with contact address `adegboyeopeyemiazeez@gmail.com`. `KIVO_OPERATOR_NAME`, `KIVO_OPERATOR_CITY`, `KIVO_OPERATOR_COUNTRY`, and `KIVO_PRIVACY_EMAIL` can override the public contact details for a deployment. Rebuild after changing these values.

With the development server running, `npm run test:save:browser` checks that Chrome-extension links wait for an explicit Save click and that inline vault creation does not submit the parent save form. It creates and removes a temporary fixture route and intercepts all save actions; no real account or backend writes are used.

The CI workflow checks lint, types, tests and build on Linux/Windows without production credentials. A committed workflow is not proof of a successful hosted run. Automated tests currently cover search grouping, redirects and URL-cache isolation/expiry/bounds; live RLS, email, mobile sharing and accessibility need integration/manual validation.

Manual acceptance with two **non-production** test accounts:

1. New signup creates defaults; email link and code both work; digit six starts one verification and expired codes recover.
2. Save a URL, repeat it for duplicate detection, and save a provider with a limited preview.
3. Upload a small image and a large decodable image; reject a file still above 5 MiB after processing.
4. Edit title/tags/notes and refresh; test long filenames, crop/full-screen behaviour and no horizontal overflow at 360×800/824, 375px and desktop.
5. Search all available groups, empty/error states, tags, vaults/settings destinations, rapid typing, keyboard selection and cancellation.
6. Share a vault, accept once with the right test email, then verify an unrelated account cannot read/edit its contents.
7. Attempt a direct API move to an inaccessible vault: RLS must reject it after `0008`.
8. Verify ordinary users cannot use admin RPCs/dashboard and an allowlisted admin can.
9. Test install, incoming shares where supported, offline fallback, returning online and sign-out/cache cleanup on real HTTPS devices.

## Troubleshooting

| Symptom | Check / resolution |
| --- | --- |
| `npm ci` fails | Use Node 24 and a matching lockfile. Update the lock only for intentional dependency changes. |
| `.ts` tests fail on old Node | Upgrade the actual Node executable; `@types/node` does not upgrade it. |
| Port in use | Stop your own server deliberately or choose another port; update local env/redirect origins. |
| Supabase fetch/key error | URL and public key must belong to the same active project. Restart/rebuild after env changes. |
| Email has 8 digits | Set hosted OTP length to 6 and request a new email. Template text alone does not change length. |
| Email has no code | Check the template actually used for that flow, including new-account confirmation; add `{{ .Token }}` and resend. |
| PWA still signed out after email | Request and enter a fresh code in the same installed-app window. |
| Wrong redirect domain/port | Check provider Site URL/allowlist, browser origin and server-built invitation origin. |
| Emails restricted/rate-limited | Configure appropriate Supabase SMTP; Brevo invitation variables are separate. |
| `can_access_vault(uuid)` missing | Verify the shared-vault migration/table before running later policies. |
| SQL object already exists | Inspect the migration ledger/schema; do not drop live tables or blindly repeat initial SQL. |
| Missing crop-position columns | Apply `0007` to the deployment's backend. |
| RLS blocks a move/update | Check membership, immutable fields, destination access and applied migrations; do not disable RLS. |
| Invite email fails | Check `0003`, Brevo sender/key, recipient address and canonical app origin. |
| Admin page not found | Check the signed-in email allowlist; denial for non-admins is expected. |
| Admin RPC errors | Apply `0005`, use the correct server-only service key; never grant browser roles privileged metrics. |
| Image upload fails | Check size/MIME, private bucket policies and browser decoding; convert unsupported HEIC when necessary. |
| Thumbnail optimisation fails | Rebuild after changing the Supabase host and test direct-source fallback. |
| Limited social preview | Public metadata may be withheld; retain the URL, without bypassing login/restricted media. |
| Search misses expected matches | Results/tags are bounded; independent tag indexing and pagination are future work. |
| PWA/share shortcut outdated | Inspect the worker/install state; reinstall after manifest changes. Clearing site data also removes local sessions/caches. |
| PWA inactive in dev | Registration is production-only. Use a production build plus HTTPS device tests. |
| Slow first dev visit | Routes compile on demand; compare production builds for deployed performance measurements. |
| Windows synced-folder stalls | Avoid overlapping Git operations; use a normal development folder outside OneDrive for a fresh clone if needed. |

## Contributing and contributors

Read [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md) and [AGENTS.md](AGENTS.md). Useful contributions include docs, accessibility, browser tests, performance, security and features. Use isolated development accounts and preserve current branding/responsive behaviour unless the change explicitly addresses them.

Keep PRs focused. Describe the behaviour changed, tests, screenshots for UI work and any SQL/configuration steps. Never put credentials, invitation links or customer data in code, issues, screenshots or AI prompts. Contributions are submitted under MIT unless separately identified and agreed with the maintainer; contributors must have the right to submit their work.

Maintainer: [@yemiSage](https://github.com/yemiSage). See [CONTRIBUTORS.md](CONTRIBUTORS.md) and the [contributors graph](https://github.com/yemiSage/kivo/graphs/contributors) for actual credit. Automated tools are not invented human contributors.

## License, assets and attribution

The [MIT License](LICENSE) covers Kivo's original code/documentation and the rights the contributors can grant. Preserve its copyright/permission notice. Dependencies and fonts retain their own terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

The current scenic asset, `public/kivo-canvas-v2.webp`, was generated for Kivo and replaces the earlier Unsplash-derived background in the current tree. [Asset provenance](docs/ASSETS.md) records the generation prompt, method and optimisation. AI generation is provenance, not a guarantee of exclusive copyright or legal clearance in every jurisdiction. The MIT license does not transfer rights in user uploads, third-party linked content or historical third-party artwork.

The old photo remains in Git history under its original rights, not MIT. Do not extract it from an older commit and assume the new code license applies. MIT also grants no trademark ownership or claim of endorsement by Kivo or service providers.

## Maintainer release checklist

- [x] Select MIT and include complete license text and package metadata.
- [x] Replace the third-party scenic background and record current asset provenance.
- [ ] Review third-party/bundled/transitive notices for the release artifacts.
- [ ] Run fresh working-tree/history credential scans and manually review personal data and external artifacts.
- [ ] Enable private vulnerability reporting and relevant GitHub protections/secret scanning. The readiness review records the last checked state.
- [ ] Review remaining production-hardening items, including DNS/egress, rate limits and storage lifecycle.
- [ ] Apply pending SQL, including `0008`, and verify policies using distinct test accounts.
- [ ] Confirm lint/types/tests/build/dependency audit and hosted CI on the actual release commit.
- [ ] Verify a clean clone with documented requirements and the operator's own credentials.
- [ ] Publish release notes with source revision, migrations, upgrade steps and known limits.

## References

- [Next.js documentation](https://nextjs.org/docs)
- [Supabase migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase passwordless authentication](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [GitHub repository licensing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
- [Sharing guide](docs/SHARING.md)
- [Readiness review](docs/OPEN_SOURCE_READINESS.md)

### R2 image storage

New uploads use private R2 Standard storage with a 100 MiB per-user quota, a 5 MiB original-image limit, and a 1 MiB stored-image limit. Existing Supabase uploads remain readable. Apply the database migration and configure the private server settings before deploying. See [R2 storage rollout](docs/R2_STORAGE.md).
