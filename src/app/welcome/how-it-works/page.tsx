import type { Metadata } from "next";
import Link from "next/link";
import { BookmarkIcon, FolderIcon, LinkIcon, SearchIcon } from "@/components/icons";
import { PageIntro, PublicShell, productPageStyles as styles } from "@/components/landing/PublicShell";
import { ArrowRightIcon } from "@/components/landing/LandingSymbols";
import { publicMetadata } from "@/lib/discoverability";

export const metadata: Metadata = publicMetadata({ title: "How Kivo works", description: "See how Kivo helps you save useful links and images, organise them in private vaults, and find them again.", path: "/welcome/how-it-works" });

export default function HowItWorksPage() {
  return <PublicShell current="/welcome/how-it-works">
    <PageIntro eyebrow="FROM FOUND TO FINDABLE" title={<>Three small steps.<br />One calmer library.</>} copy="Kivo turns the things you stumble across into a personal collection you can actually return to.">
      <div className={styles.heroActions}><Link className={styles.primary} href="/login">Start saving <ArrowRightIcon /></Link><Link className={styles.secondary} href="/welcome/features">Explore features</Link></div>
    </PageIntro>
    <section className={styles.section} aria-labelledby="steps-title">
      <div className={styles.sectionLabel}><div><p>THE SIMPLE VERSION</p><h2 id="steps-title">Save it. Place it. Find it.</h2></div><p>No complicated setup. Review every save, choose where it belongs, then search your own library when memory gets fuzzy.</p></div>
      <div className={styles.steps}>
        <article className={styles.step}><span className={styles.stepNumber}>01</span><div className={styles.stepVisual}><div className={styles.mockLink}><LinkIcon size={17} /><span>that-really-good-article.com</span><BookmarkIcon size={16} /></div></div><h3>Capture the find</h3><p>Paste a link, upload a supported image, or send a page from the Chrome extension into the review-first save flow.</p></article>
        <article className={styles.step}><span className={styles.stepNumber}>02</span><div className={styles.stepVisual}><div className={styles.mockFolder}><FolderIcon size={28} /></div></div><h3>Give it a home</h3><p>Choose a vault, add a note or tags, and keep the context that made the find worth saving in the first place.</p></article>
        <article className={styles.step}><span className={styles.stepNumber}>03</span><div className={styles.stepVisual}><div className={styles.mockSearch}><div><SearchIcon size={16} /> weekend ideas</div><span /><span /></div></div><h3>Pick it back up</h3><p>Search titles, notes, tags and vaults in your private library, then continue exactly where your curiosity left off.</p></article>
      </div>
      <div className={styles.promise}><h2>Private by default.<br />Shared on purpose.</h2><p>Your library requires your account. Vault collaboration is limited to authorised members, so sharing a collection does not turn your saves into public pages.</p></div>
    </section>
  </PublicShell>;
}
