# Security review

- Discoverability applies only to public product and policy content.
- Authentication, Supabase RLS and server-only keys remain the access controls; robots.txt is not treated as security.
- The root metadata policy fails closed with `noindex, nofollow`; public pages opt in.
- Private routes receive `X-Robots-Tag: noindex, nofollow, noarchive` where appropriate.
- Sitemap, structured data, social images and `/llms.txt` contain no account, vault, invitation, upload, admin or internal API data.
- JSON-LD escapes `<` before insertion.
- No analytics tracker, public API or agent endpoint was added.
- Crawler user agents are not sufficient for WAF trust; production allow rules must also use provider-published IP data or verified-bot signals.

This review is not a penetration test and does not verify hosted RLS, provider settings, WAF rules or logs.
