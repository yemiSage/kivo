import { absoluteUrl, SITE_DESCRIPTION } from "@/lib/discoverability";

export const dynamic = "force-static";

export function GET() {
  const body = `# Kivo\n\n> ${SITE_DESCRIPTION}\n\nKivo is an open-source web application for saving links and supported images, organising them into private or shared vaults, adding notes and tags, and searching a personal library. Account content is private and is never part of this public discovery document.\n\n## Public pages\n\n- [Product overview](${absoluteUrl("/welcome")})\n- [Frequently asked questions](${absoluteUrl("/welcome/faq")})\n- [Contact](${absoluteUrl("/welcome/contact")})\n- [Privacy policy](${absoluteUrl("/welcome/privacy")})\n- [Terms of use](${absoluteUrl("/welcome/terms")})\n- [Source code](https://github.com/yemiSage/kivo)\n\n## Product boundaries\n\nKivo is not a public content network, public search index, secure document vault, guaranteed offline backup, or automated account-deletion service. Saved content, vaults, invitations, account data, administration and internal APIs require authorization and must not be indexed or inferred from this document.\n`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
