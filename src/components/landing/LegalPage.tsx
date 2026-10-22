import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "../BrandLogo";
import styles from "./legal.module.css";

export type LegalSection = { id: string; title: string; content: ReactNode };

export function LegalPage({ title, summary, sections, eyebrow = "KIVO · LEGAL", metaLine = "Effective and last updated: 22 October 2026" }: { title: string; summary: string; sections: LegalSection[]; eyebrow?: string; metaLine?: string }) {
  return <div className={styles.page}>
    <header className={styles.header}><Link href="/welcome" aria-label="Kivo home"><BrandLogo height={32} /></Link><Link href="/welcome" className={styles.back}>Back to Kivo <span aria-hidden="true">↗</span></Link></header>
    <main className={styles.main}>
      <div className={styles.intro}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p className={styles.summary}>{summary}</p>{metaLine && <p className={styles.date}>{metaLine}</p>}</div>
      <div className={styles.body}>
        <nav className={styles.contents} aria-label="On this page"><p>ON THIS PAGE</p>{sections.map((section, index) => <a key={section.id} href={`#${section.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{section.title.replace(/^\d+\.\s*/, "")}</a>)}</nav>
        <article className={styles.article}>{sections.map(section => <section key={section.id} id={section.id}><h2>{section.title}</h2>{section.content}</section>)}</article>
      </div>
    </main>
    <footer className={styles.footer}><span>© 2026 Kivo</span><nav aria-label="Public information"><Link href="/welcome/faq" aria-current={title === "Frequently asked questions" ? "page" : undefined}>FAQ</Link><Link href="/welcome/contact" aria-current={title === "Contact Kivo" ? "page" : undefined}>Contact</Link><Link href="/welcome/privacy" aria-current={title === "Privacy Policy" ? "page" : undefined}>Privacy</Link><Link href="/welcome/terms" aria-current={title === "Terms of Use" ? "page" : undefined}>Terms</Link></nav></footer>
  </div>;
}
