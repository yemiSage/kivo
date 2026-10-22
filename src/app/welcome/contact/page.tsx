import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/landing/LegalPage";
import { getPolicyOperator } from "@/components/landing/policies";
import { publicMetadata } from "@/lib/discoverability";

export const metadata: Metadata = publicMetadata({ title: "Contact Kivo", description: "Contact the Kivo operator for support, privacy requests, account requests and security concerns.", path: "/welcome/contact" });

export default function ContactPage() {
  const operator = getPolicyOperator();
  const email = operator.email;
  const sections: LegalSection[] = [
    { id: "support", title: "1. Product support", content: <p>For help with your account, saved content, invitations or installation, {email ? <>email <a href={`mailto:${email}`}>{email}</a></> : <>contact the maintainer through the public source repository</>}. Never send passwords or verification codes.</p> },
    { id: "privacy", title: "2. Privacy and account requests", content: <p>Use the same contact channel for access, correction, deletion or data-copy requests. Send the request from the email linked to your account where possible. Requests require proportionate identity verification and are not completed automatically.</p> },
    { id: "security", title: "3. Security reports", content: <p>Report suspected vulnerabilities privately. Include enough detail to reproduce the issue, but do not include another person’s saved content, credentials or live invitation links. See the repository security policy before testing.</p> },
    { id: "operator", title: "4. Operator", content: <p>Kivo is operated by {operator.name}{operator.city && operator.country ? ` in ${operator.city}, ${operator.country}` : ""}. The public source code is available at <a href="https://github.com/yemiSage/kivo" target="_blank" rel="noreferrer">github.com/yemiSage/kivo</a>.</p> },
  ];
  return <LegalPage title="Contact Kivo" summary="Support, privacy and security contact information for the operated Kivo service." eyebrow="KIVO · CONTACT" metaLine="Do not send passwords, verification codes or unnecessary sensitive information" sections={sections} />;
}
