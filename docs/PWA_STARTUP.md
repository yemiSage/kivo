# PWA startup

New installations open the library directly at "/". Older installations using "/launch" are redirected by the service worker before loading splash JavaScript; the server also redirects that URL when no worker controls the page. The old "/?source=pwa" URL loads the library directly.

Primary navigation uses Next.js automatic prefetching with the existing loading boundary. Item cards retain intent-only prefetching so a large library does not prefetch every detail page.

Authentication and database permissions still protect the library. Private documents remain network-first, with cached documents available after a network failure. The offline shell and static assets remain cached. Worker v3 replaces previous versioned caches and preserves the share inbox; no cloud data is removed.

Optional worker registration waits for document load and an idle opportunity. Search code loads when first opened. These changes remove the splash hydration detour; authenticated library speed still depends on server, Auth and database latency.

Deploy the app and worker together. Existing installations need the updated worker active. Physical-device startup and deployed authenticated timings require separate verification.

Ordinary page reads use request-scoped SDK-verified token claims instead of fetching a fresh Auth user record before each database read. Actions and superadmin access retain fresh user lookups. Claims validate signature and expiration; revocations elsewhere take effect when the token expires. Database queries continue using the caller token and RLS. The configured backend published one asymmetric public key when checked locally.
