# Production readiness

## Ready in source

- Public metadata, canonicals, sitemap, robots policy, structured data, FAQ/contact content, social images and AI discovery file.
- Private-route noindex defenses.
- Deterministic production endpoint test in CI.
- Next.js 16.4.2 with a zero-finding `npm audit --audit-level=high` result at verification time.
- Production build, endpoint checks and responsive browser tests passing locally.

## Required before claiming production completion

1. Set and verify the production `NEXT_PUBLIC_SITE_URL`; rebuild after changes.
2. Deploy the tested revision through the existing protected workflow.
3. Fetch every discovery endpoint from the public domain.
4. Confirm CDN/WAF behavior for verified crawlers.
5. Verify ownership in search-provider consoles and submit the sitemap if authorized.
6. Validate social previews and record cache behavior.
7. Collect field performance and indexing data over time.

No deployment, provider verification, sitemap submission, indexing or analytics collection is claimed by this local implementation.
