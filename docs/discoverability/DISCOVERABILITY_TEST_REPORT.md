# Discoverability test report

The production test starts the built application on an isolated local port and verifies:

- robots groups and sitemap declaration;
- canonical public sitemap entries and private-route exclusion;
- privacy-safe `/llms.txt` content;
- public page HTTP responses, canonicals, index directives, Open Graph and X metadata;
- JSON-LD presence;
- generated social-image MIME type and 1200×630 dimensions;
- private login page meta and response-header noindex controls.

## Local verification — 22 October 2026

| Command | Outcome |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed; 151 files checked after the public-page UI update |
| `npm test` | Passed; 35 tests |
| `npm run check:docs` | Passed; 51 local Markdown paths checked |
| `npm run check:secrets` | Passed; no pattern findings in the working tree or reachable history checked by the script |
| `npm audit --audit-level=high` | Passed; zero known vulnerabilities after updating Next.js to 16.4.2 |
| `npm run build` | Passed; 32 static/dynamic routes generated or registered |
| `npm run test:discoverability:production` | Passed against an isolated production server |
| `npm run test:landing:browser` | Passed at 1440×960, 390×844 and 320×568, plus reduced-motion and protected-route checks |

The browser suite used a separate production server so the active development session was not interrupted. Provider indexing, hosted WAF behavior, field Core Web Vitals and social-platform cache refreshes are not local test claims.

## Public-page UI completion

How it works and Features now have dedicated pages. FAQ and Contact use the same public shell, with responsive navigation and Bricolage Grotesque headings. All four pages passed targeted production browser checks at 1440px, 390px and 320px for successful responses, viewport fit, heading typography, current-page navigation and FAQ expansion. The updated production endpoint test passed for all seven public pages. A first browser run waiting for the full load event timed out; the targeted run waiting for rendered content completed successfully.
