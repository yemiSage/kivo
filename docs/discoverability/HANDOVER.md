# Discoverability handover

The implementation is intentionally small and fail-closed. Add a page to `publicPages` only when it is public, canonical, published and safe to index. Apply `publicMetadata()` explicitly; otherwise the root noindex policy remains in force. Keep JSON-LD synchronized with visible content.

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run check:docs
npm run check:secrets
npm run build
npm run test:discoverability:production
```

When changing crawler policy, check current primary provider documentation. When changing the production domain, update `NEXT_PUBLIC_SITE_URL` and rebuild. Never add private product URLs to the sitemap or discovery documents.
