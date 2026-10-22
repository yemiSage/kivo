import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { PageIntro, PublicShell, productPageStyles as styles } from "@/components/landing/PublicShell";
import { publicMetadata, absoluteUrl } from "@/lib/discoverability";

export const metadata: Metadata = publicMetadata({ title: "Frequently asked questions", description: "Answers about saving, organising, searching, sharing, privacy, installation and AI categorisation in Kivo.", path: "/welcome/faq" });

const questions = [
  ["what-is-kivo", "What is Kivo?", "Kivo is a personal library for links, images and ideas. Save a find, organise it in a vault, add notes or tags, and search for it later."],
  ["what-can-i-save", "What can I save?", "You can save web links and supported image uploads. Link previews are best-effort because independent websites decide what public preview information they provide."],
  ["are-saves-public", "Are my saves public?", "No. Your library and private vaults require your account. A shared vault is visible only to authorised members, and invitation links should be treated as private."],
  ["how-search-works", "How does search work?", "Search matches information in your own library, including titles, notes, tags and vaults. Kivo is not a public web search engine."],
  ["install-kivo", "Can I install Kivo?", "Supported browsers can install Kivo as a progressive web app. A downloadable Chrome extension also opens the review-first save flow on desktop; it does not save pages silently."],
  ["offline", "Does Kivo work offline?", "Previously visited pages and images may be cached for limited offline access. Kivo is not an offline backup and does not provide a general offline write queue."],
  ["ai", "Does Kivo use AI?", "Kivo always has built-in categorisation rules. If the operator enables Gemini, limited save metadata and existing vault names may be sent to suggest a category. Uploaded image bytes and the separate notes field are not sent by that integration."],
] as const;

export default function FaqPage() {
  const schema = { "@context": "https://schema.org", "@type": "FAQPage", url: absoluteUrl("/welcome/faq"), mainEntity: questions.map(([, name, text]) => ({ "@type": "Question", name, acceptedAnswer: { "@type": "Answer", text } })) };
  return <><JsonLd data={schema} /><PublicShell current="/welcome/faq">
    <PageIntro eyebrow="GOOD QUESTIONS" title={<>A few things<br />worth knowing.</>} copy="Straight answers about saving, searching, privacy, installation and what happens behind the scenes." />
    <section className={styles.section} aria-labelledby="faq-title">
      <div className={styles.sectionLabel}><div><p>THE DETAILS</p><h2 id="faq-title">Questions, answered.</h2></div><p>From your first save to a shared vault, find the details that help you feel at home.</p></div>
      <div className={styles.faqList}>{questions.map(([id, title, answer], index) => <details className={styles.faqItem} key={id} id={id} open={index === 0}><summary>{title}<span aria-hidden="true">+</span></summary><p className={styles.faqAnswer}>{answer}</p></details>)}</div>
    </section>
  </PublicShell></>;
}
