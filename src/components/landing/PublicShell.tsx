import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { ArrowRightIcon } from "./LandingSymbols";
import styles from "./product-pages.module.css";

const navigation = [
  ["Home", "/welcome"],
  ["How it works", "/welcome/how-it-works"],
  ["Features", "/welcome/features"],
  ["FAQ", "/welcome/faq"],
  ["Contact us", "/welcome/contact"],
] as const;

export function PublicShell({ current, children }: { current?: string; children: ReactNode }) {
  return <div className={styles.page}>
    <a className={styles.skipLink} href="#content">Skip to content</a>
    <header className={styles.header}>
      <Link href="/welcome" aria-label="Kivo home"><BrandLogo height={30} /></Link>
      <nav aria-label="Primary navigation">{navigation.map(([label, href]) => <Link key={href} href={href} aria-current={current === href ? "page" : undefined}>{label}</Link>)}</nav>
      <Link className={styles.headerCta} href="/login">Get started <ArrowRightIcon /></Link>
    </header>
    <main id="content">{children}</main>
    <footer className={styles.footer}>
      <div><BrandLogo height={24} /><p>A home for your good finds.</p></div>
      <nav aria-label="Footer navigation">{navigation.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}<Link href="/welcome/privacy">Privacy</Link><Link href="/welcome/terms">Terms</Link></nav>
      <p>© 2026 Kivo · <a href="https://github.com/yemiSage/kivo" target="_blank" rel="noreferrer">Open source</a></p>
    </footer>
  </div>;
}

export function PageIntro({ eyebrow, title, copy, children }: { eyebrow: string; title: ReactNode; copy: string; children?: ReactNode }) {
  return <section className={styles.hero}>
    <div className={styles.heroCopy}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{copy}</p>{children}</div>
  </section>;
}

export { styles as productPageStyles };
