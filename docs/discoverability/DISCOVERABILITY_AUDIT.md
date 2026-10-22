# Discoverability audit

Reviewed 22 October 2026 against the local repository with `bedb954` as the implementation baseline. This is source evidence, not proof of deployment, indexing, provider verification, hosted database state, CDN rules, or production analytics.

## Architecture

- Next.js 16.4 App Router, React 19.3, Node 24, TypeScript 7.
- Supabase authentication/database with RLS; private R2/Supabase media; optional Brevo and Gemini server integrations.
- Vercel is the documented host. `NEXT_PUBLIC_SITE_URL` is the deployment-specific origin; the source-backed main-service fallback is `https://kivo-save.vercel.app`.
- Public product content is server-rendered at `/welcome` and its public information pages. Library, vault, profile, administration, saves, invitations, account data and internal APIs are private.

## Route classification

| Class | Routes | Index policy |
| --- | --- | --- |
| Public and indexable | `/welcome`, `/welcome/how-it-works`, `/welcome/features`, `/welcome/faq`, `/welcome/contact`, `/welcome/privacy`, `/welcome/terms` | Sitemap, canonical, index/follow |
| Public machine-readable | `/robots.txt`, `/sitemap.xml`, `/llms.txt`, generated social images | Crawlable, not sitemap page entries |
| Public but non-indexable | `/login`, `/offline`, `/launch`, auth handoff routes | Root noindex plus route/header controls |
| Authenticated/private | `/`, `/collections/**`, `/item/**`, `/profile/**`, `/save/**`, `/vault-invite/**` | Auth/RLS plus noindex and robots exclusions |
| Administrative/internal | `/admin/**`, `/api/**`, `/share-target/**` | Authorization or validation plus noindex and robots exclusions |

## Findings and completion matrix

| Area | Existing | Missing/risk | Implementation | Priority | Complexity | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Metadata | Basic titles/descriptions | No canonicals, social fields, safe default robots | Shared public metadata; global private default | High | Medium | Complete locally |
| Sitemap | None | Public pages undiscoverable by sitemap | Next.js sitemap with seven canonical pages | High | Low | Complete locally |
| robots.txt | None | No crawler policy | Search crawlers allowed; private paths excluded; training-only tokens denied | High | Medium | Complete locally |
| Structured data | None | Product/entity ambiguity | WebSite, SoftwareApplication and visible FAQ JSON-LD | Medium | Medium | Complete locally |
| Social sharing | No complete OG/X image metadata | Inconsistent previews | Generated 1200×630 OG and X image | High | Medium | Complete locally |
| AI-readable content | Product landing and policies | No concise discovery file or FAQ | Public FAQ/contact and `/llms.txt` | Medium | Medium | Complete locally |
| Private-route protection | Auth and RLS | Search directives incomplete | Default noindex, explicit private response headers, robots exclusions | High | Medium | Complete locally |
| Public API docs | Internal application endpoints only | Publishing them would expose unsupported surface | Do not publish | — | — | Out of scope |
| Agent protocol | No approved agent-facing operation or OAuth resource server | Large product/security expansion | Do not implement | — | — | Out of scope |
| Local/e-commerce/multilingual SEO | No matching content model | Would fabricate product scope | Do not implement | — | — | Out of scope |
| Analytics dashboard | No configured analytics/provider credentials | Consent, ownership and data dependencies | No tracker/dashboard added | — | — | External decision |
| Performance | Responsive landing tests and optimized images exist | No field data | Preserve; production browser tests cover viewport fit | Medium | Medium | Lab/local only |
| CI | Lint, types, unit, docs, secrets, audit, build | No production discoverability endpoint check | Added post-build production test | High | Medium | Complete locally |

## External verification still required

- Set the correct `NEXT_PUBLIC_SITE_URL` for every deployment and rebuild.
- Verify the production domain in Google Search Console and Bing Webmaster Tools.
- Confirm CDN/WAF access for verified crawler IP ranges; do not trust user-agent strings alone.
- Submit the production sitemap only with authorized provider access.
- Validate deployed social previews using platform tools.
- Measure field Core Web Vitals and indexing through provider data.
