import { absoluteUrl, SITE_DESCRIPTION } from "@/lib/discoverability";

export const dynamic = "force-static";

export function GET() {
  const body = `# Kivo

> ${SITE_DESCRIPTION}

Kivo is an open-source web application for saving links and supported images, organising them into private or shared vaults, adding notes and tags, and searching a personal library. Account content is private and is never part of this public discovery document.

## Public pages

- [Product overview](${absoluteUrl("/welcome")})
- [How Kivo works](${absoluteUrl("/welcome/how-it-works")})
- [Features](${absoluteUrl("/welcome/features")})
- [Frequently asked questions](${absoluteUrl("/welcome/faq")})
- [Contact](${absoluteUrl("/welcome/contact")})
- [Privacy policy](${absoluteUrl("/welcome/privacy")})
- [Terms of use](${absoluteUrl("/welcome/terms")})
- [Source code](https://github.com/yemiSage/kivo)

## Product boundaries

Kivo is not a public content network, public search index, secure document vault, guaranteed offline backup, or automated account-deletion service. Saved content, vaults, invitations, account data, administration and internal APIs require authorization and must not be indexed or inferred from this document.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
