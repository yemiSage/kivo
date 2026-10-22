import type { Metadata } from "next";
import Link from "next/link";
import { BookmarkIcon, FolderIcon, ImageIcon, MobileIcon, SearchIcon, ShareIcon, ShieldIcon, SparkleIcon } from "@/components/icons";
import { PageIntro, PublicShell, productPageStyles as styles } from "@/components/landing/PublicShell";
import { ArrowRightIcon } from "@/components/landing/LandingSymbols";
import { publicMetadata } from "@/lib/discoverability";

export const metadata: Metadata = publicMetadata({ title: "Kivo features", description: "Explore Kivo's private vaults, search, link and image saving, collaboration, browser extension and installable web app.", path: "/welcome/features" });

const features = [
  { title: "Save what catches your eye", copy: "Keep web links and supported images with the title, note and tags that make them useful.", icon: BookmarkIcon, className: styles.featureWide, tag: "CAPTURE" },
  { title: "Vaults for every rabbit hole", copy: "Collect research, plans and passing obsessions without forcing everything into one list.", icon: FolderIcon, className: styles.featureTint, tag: "ORGANISE" },
  { title: "Search your own memory", copy: "Find matches across titles, notes, tags and vaults without making your private library public.", icon: SearchIcon, className: styles.featureLavender, tag: "FIND" },
  { title: "Links and images", copy: "Save useful pages and supported image uploads in one consistent library.", icon: ImageIcon, className: "", tag: "FORMATS" },
  { title: "Collect together", copy: "Invite authorised members into a shared vault when the collection is better as a team effort.", icon: ShareIcon, className: styles.featureWide, tag: "COLLABORATE" },
  { title: "Ready on the devices you use", copy: "Install the progressive web app or use the Chrome extension to open Kivo's review-first flow.", icon: MobileIcon, className: "", tag: "INSTALL" },
] as const;

export default function FeaturesPage() {
  return <PublicShell current="/welcome/features">
    <PageIntro eyebrow="THE USEFUL BITS" title={<>Built for the<br />way curiosity works.</>} copy="Fast enough for a passing thought. Organised enough for the project that thought becomes.">
      <div className={styles.heroActions}><Link className={styles.primary} href="/login">Get started <ArrowRightIcon /></Link><Link className={styles.secondary} href="/welcome/how-it-works">See how it works</Link></div>
    </PageIntro>
    <section className={styles.section} aria-labelledby="features-title">
      <div className={styles.sectionLabel}><div><p>YOUR COLLECTION, YOUR WAY</p><h2 id="features-title">A little structure. Plenty of room.</h2></div><p>Each feature is designed to reduce the distance between noticing something good and finding it again.</p></div>
      <div className={styles.bento}>{features.map(({ title, copy, icon: Icon, className, tag }) => <article key={title} className={`${styles.feature} ${className}`}><span className={styles.featureTag}>{tag}</span><span className={styles.featureIcon}><Icon size={21} /></span><h2>{title}</h2><p>{copy}</p></article>)}</div>
      <div className={styles.privacyStrip}><ShieldIcon size={28} /><div><h2>Privacy is part of the shape of the product.</h2><p>Account content is not placed in the public sitemap, discovery files or public search pages.</p></div><SparkleIcon size={24} /></div>
    </section>
  </PublicShell>;
}
