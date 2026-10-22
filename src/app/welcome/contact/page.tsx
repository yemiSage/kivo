import type { Metadata } from "next";
import { ExternalIcon, InfoIcon, ShieldIcon, UserIcon } from "@/components/icons";
import { PageIntro, PublicShell, productPageStyles as styles } from "@/components/landing/PublicShell";
import { getPolicyOperator } from "@/components/landing/policies";
import { publicMetadata } from "@/lib/discoverability";

export const metadata: Metadata = publicMetadata({ title: "Contact Kivo", description: "Contact the Kivo operator for support, privacy requests, account requests and security concerns.", path: "/welcome/contact" });

export default function ContactPage() {
  const operator = getPolicyOperator();
  const email = operator.email;
  const mail = email ? `mailto:${email}` : "https://github.com/yemiSage/kivo";
  return <PublicShell current="/welcome/contact">
    <PageIntro eyebrow="LET'S TALK" title={<>The right place<br />for your question.</>} copy="Need a hand with your collection, your account or something else? Here’s how to get in touch." />
    <section className={styles.section} aria-labelledby="contact-title">
      <div className={styles.sectionLabel}><div><p>CONTACT ROUTES</p><h2 id="contact-title">How can we help?</h2></div><p>Never send passwords, sign-in codes, private invitation links or another person’s saved content.</p></div>
      <div className={styles.contactGrid}>
        <article className={styles.contactCard}><InfoIcon size={24} /><h2>Product support</h2><p>Questions about your account, saved content, invitations or installation.</p><a href={mail}>{email ?? "Open the source repository"}</a></article>
        <article className={styles.contactCard}><UserIcon size={24} /><h2>Privacy and account requests</h2><p>Access, correction, deletion or data-copy requests. Write from the email linked to your account where possible.</p><a href={mail}>Start a private request</a></article>
        <article className={styles.contactCard}><ShieldIcon size={24} /><h2>Security reports</h2><p>Report a suspected vulnerability privately and include only the detail needed to reproduce it safely.</p><a href={mail}>Report privately</a></article>
        <article className={styles.contactCard}><ExternalIcon size={24} /><h2>Project and operator</h2><p>Operated by {operator.name}{operator.city && operator.country ? ` in ${operator.city}, ${operator.country}` : ""}. The source is public for inspection and contribution.</p><a href="https://github.com/yemiSage/kivo" target="_blank" rel="noreferrer">View the source repository</a></article>
      </div>
      <p className={styles.contactNote}>Requests may require proportionate identity verification. Sending a request does not automatically complete an account or data change.</p>
    </section>
  </PublicShell>;
}
