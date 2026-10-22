# Discoverability architecture

`src/lib/discoverability.ts` is the single source for the canonical origin, public metadata, sitemap inventory and truthful product schemas. The root layout defaults to `noindex`; eligible public pages explicitly opt into indexing through `publicMetadata()`. This fail-closed model prevents new authenticated pages from becoming indexable accidentally.

Next.js special metadata routes generate `/robots.txt`, `/sitemap.xml`, and the Open Graph/X images. `/llms.txt` is a cached static route. The Supabase proxy explicitly permits these machine-readable resources without an authentication round trip. Private families also receive `X-Robots-Tag` headers from `next.config.ts`; authentication and RLS remain the security boundary.

No public API catalogue or agent-protocol service is exposed. Existing `/api/**` handlers are product-internal and remain excluded.
