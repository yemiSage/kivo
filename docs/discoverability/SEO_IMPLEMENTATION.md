# SEO implementation

- Canonical, title, description, locale, robots, Open Graph and X metadata cover every eligible public page.
- `/sitemap.xml` contains only seven canonical public pages and omits private/account/API routes.
- `/robots.txt` allows public content while excluding private route families. It allows Googlebot, Bingbot, OAI-SearchBot and PerplexityBot under the same private-path exclusions. GPTBot and Google-Extended are denied as training/non-Search controls; these settings do not affect Google Search eligibility.
- WebSite and SoftwareApplication JSON-LD describe visible product capabilities. FAQPage data mirrors visible FAQ answers.

References: [Next.js metadata](https://nextjs.org/docs/app/getting-started/metadata-and-og-images), [Google AI search guidance](https://developers.google.com/search/docs/appearance/ai-features), [Bing webmaster guidelines](https://www.bing.com/webmasters/help/webmaster-guidelines-30fba23a).
