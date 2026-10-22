"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { BrandLogo } from "../BrandLogo";
import { ArrowRightIcon } from "./LandingSymbols";
import { BookmarkIcon, CheckIcon, ChevronDownIcon, FolderIcon, ImageIcon, LinkIcon, SearchIcon, ShareIcon } from "../icons";
import styles from "./landing.module.css";

const chapters = [
  { id: "intro", label: "Meet Kivo", eyebrow: "FOR EVERYTHING WORTH KEEPING", title: <>Good finds.<br />A place to keep them.</>, copy: "That link. That image. That idea for later. Save it all in Kivo, and come back to what caught your eye." },
  { id: "save", label: "Save", eyebrow: "FROM ANYWHERE, TO ONE PLACE", title: <>Less “where was that?”<br />More “got it.”</>, copy: "Paste a link, upload an image, or send a page from Chrome. Your next good find is only a save away." },
  { id: "organise", label: "Organise", eyebrow: "A LITTLE ORDER FOR YOUR IDEAS", title: <>Give your rabbit holes<br />a home.</>, copy: "Make a vault for a project, a plan, or a passing obsession. Keep it private, or invite someone to collect with you." },
  { id: "find", label: "Find", eyebrow: "SAVED FOR A REASON. FOUND IN A SECOND.", title: <>Find the thing.<br />Keep the spark.</>, copy: "A title, a tag, a half-remembered word. Search across your saves and pick up right where your curiosity left off." },
  { id: "start", label: "Get Kivo", eyebrow: "YOUR NEXT GOOD FIND IS OUT THERE", title: <>Keep a little<br />of what you love.</>, copy: "Make room for the ideas you haven’t used yet. Your own corner of the internet, ready when you are." },
];

function FindCard({ kind = "landscape", title, label, className = "" }: { kind?: "landscape" | "type" | "note"; title: string; label: string; className?: string }) {
  return <div className={`${styles.findCard} ${className}`}>
    <div className={`${styles.cardArt} ${styles[kind]}`}>
      {kind === "type" && <span>Make<br /><i>something.</i></span>}
      {kind === "note" && <><span className={styles.noteStar}>✳</span><span>Small ideas.<br />Big possibilities.</span></>}
    </div>
    <div className={styles.cardCaption}><span>{title}</span><small>{label}</small></div>
    <span className={styles.cardBookmark}><BookmarkIcon size={13} /></span>
  </div>;
}

function HeroVisual() {
  return <div className={styles.collage} aria-label="A collection of travel inspiration, design ideas and notes">
    <FindCard title="Somewhere slower" label="For the next escape" className={styles.travelCard} />
    <FindCard kind="type" title="A little type inspiration" label="Design inspiration" className={styles.typeCard} />
    <FindCard kind="note" title="The start of something" label="Business ideas" className={styles.noteCard} />
    <div className={styles.kivoToken}><BookmarkIcon size={52} variant="Bold" /><span>kept with kivo</span></div>
    <span className={`${styles.looseTag} ${styles.tagOne}`}><LinkIcon size={13} /> That really good article</span>
    <span className={`${styles.looseTag} ${styles.tagTwo}`}><ImageIcon size={13} /> A little inspiration</span>
    <span className={styles.pencilNote}>less lost, more found.<svg viewBox="0 0 75 40" aria-hidden="true"><path d="M4 5Q30 40 65 17m-13-2 15 1-5 13" /></svg></span>
  </div>;
}

function SaveVisual() {
  return <div className={styles.saveVisual}>
    <div className={styles.sourceChips}><span><LinkIcon size={16} /> A link</span><span><ImageIcon size={16} /> An image</span><span><ShareIcon size={16} /> A shared find</span></div>
    <div className={styles.saveWindow}>
      <div className={styles.windowBar}><BrandLogo height={22} /><span>Save something good</span><span className={styles.windowDots}>•••</span></div>
      <div className={styles.urlField}><LinkIcon size={17} /><span>https://a-really-good-find.com</span><CheckIcon size={17} /></div>
      <div className={styles.savePreview}><div className={styles.previewPhoto} /><div><small>YOUR NEXT ADVENTURE</small><h3>A slower kind of weekend.</h3><p>Some places are worth coming back to.</p></div></div>
      <div className={styles.vaultChoice}><FolderIcon size={16} /><span>Weekend plans</span><CheckIcon size={15} /></div>
      <div className={styles.mockSave}><BookmarkIcon size={16} /> Save to Kivo</div>
    </div>
    <div className={styles.savedReceipt}><span><CheckIcon size={18} /></span><div>Good find. Safely kept.<small>Ready when you are.</small></div></div>
  </div>;
}

const vaults = [
  { name: "Design inspiration", count: "A fresh perspective", className: "lavender", kind: "type" },
  { name: "Weekend plans", count: "A little time away", className: "green", kind: "landscape" },
  { name: "The next big idea", count: "Something to build on", className: "yellow", kind: "note" },
] as const;

function VaultVisual() {
  return <div className={styles.vaultVisual}>{vaults.map(vault => <div key={vault.name} className={`${styles.vaultFolder} ${styles[vault.className]}`}>
    <div className={styles.folderTab}><FolderIcon size={14} /></div>
    <div className={styles.folderPaper}><div className={`${styles.folderArt} ${styles[vault.kind]}`}>{vault.kind === "type" ? "Aa" : vault.kind === "note" ? "✳" : ""}</div></div>
    <div className={styles.folderFront}><FolderIcon size={21} /><h3>{vault.name}</h3><p>{vault.count}</p></div>
  </div>)}<div className={styles.collaboration}><span className={styles.avatar}>Y</span><span className={styles.avatar}>A</span><span>Better finds, together.</span></div></div>;
}

function SearchVisual() {
  return <div className={styles.searchVisual}>
    <div className={styles.searchWindow}>
      <div className={styles.searchField}><SearchIcon size={21} /><span>weekend</span><span className={styles.searchCursor} /><kbd>esc</kbd></div>
      <div className={styles.searchResults}><p>RIGHT WHERE YOU LEFT IT</p><small>VAULTS</small><div className={styles.searchVault}><span><FolderIcon size={20} /></span><div>Weekend plans<small>Your little escape collection</small></div><ArrowRightIcon /></div><small>SAVED FINDS</small>
        <div className={styles.resultRow}><div className={styles.resultPhoto} /><div>A slower kind of <mark>weekend</mark>.<small>Article · weekend-journal.com</small></div><BookmarkIcon size={16} /></div>
        <div className={styles.resultRow}><div className={styles.resultSymbol}><ImageIcon size={20} /></div><div>A cabin to come back to<small>Image · #weekend</small></div><BookmarkIcon size={16} /></div>
      </div>
      <div className={styles.searchBottom}><span>Links, images, videos, vaults. All here.</span><span>↵</span></div>
    </div>
    <span className={styles.searchAnnotation}>Your memory, with a search bar.</span>
  </div>;
}

function StartVisual() {
  return <div className={styles.startVisual}><div className={styles.finalBookmark}><BookmarkIcon size={100} variant="Bold" /><BrandLogo height={40} /></div><span className={styles.finalTag}><CheckIcon size={15} /> A home for your good finds.</span></div>;
}

const visuals = [HeroVisual, SaveVisual, VaultVisual, SearchVisual, StartVisual];

export function LandingPage() {
  const scroller = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const goTo = (index: number) => {
    const element = scroller.current;
    if (!element) return;
    const next = Math.max(0, Math.min(chapters.length - 1, index));
    element.scrollTo({ top: next * element.clientHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  };

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const index = Math.max(0, Math.min(chapters.length - 1, Math.round(element.scrollTop / element.clientHeight)));
        activeRef.current = index;
        setActive(index);
        frame = 0;
      });
    };
    let previousHeight = element.clientHeight;
    const resize = new ResizeObserver(() => {
      const height = element.clientHeight;
      if (height !== previousHeight) {
        element.scrollTop = activeRef.current * height;
        previousHeight = height;
      }
    });
    resize.observe(element);
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => { cancelAnimationFrame(frame); resize.disconnect(); element.removeEventListener("scroll", onScroll); };
  }, []);

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest("a, button, input, textarea, select")) return;
    const moves: Record<string, number> = { ArrowDown: active + 1, PageDown: active + 1, " ": active + (event.shiftKey ? -1 : 1), ArrowUp: active - 1, PageUp: active - 1, Home: 0, End: chapters.length - 1 };
    if (event.key in moves) { event.preventDefault(); goTo(moves[event.key]); }
  }

  return <div className={styles.landing}>
    <a className={styles.skipLink} href="#landing-content">Skip to content</a>
    <header className={styles.header}>
      <a href="#intro" aria-label="Kivo home" onClick={event => { event.preventDefault(); goTo(0); }}><BrandLogo height={32} /></a>
      <nav aria-label="Product sections" className={styles.topNav}>{chapters.slice(1, 4).map((chapter, index) => <button key={chapter.id} type="button" aria-current={active === index + 1 ? "step" : undefined} onClick={() => goTo(index + 1)}>{chapter.label}</button>)}</nav>
      <Link href="/login" prefetch={false} className={styles.signIn}>Get started <ArrowRightIcon /></Link>
    </header>
    <main ref={scroller} id="landing-content" tabIndex={0} className={styles.scrollport} onKeyDown={onKeyDown} aria-label="Discover Kivo. Scroll or use the arrow keys to explore.">
      <div className={styles.track}>
        <div className={styles.stage}>
          {chapters.map((chapter, index) => {
            const Visual = visuals[index];
            return <section key={chapter.id} id={chapter.id} className={styles.scene} data-active={active === index} data-before={active > index} aria-hidden={active !== index} inert={active !== index} aria-labelledby={`${chapter.id}-title`}>
              <div className={styles.sceneIntro}><p className={styles.eyebrow}>{chapter.eyebrow}</p>{index === 0 ? <h1 id={`${chapter.id}-title`}>{chapter.title}</h1> : <h2 id={`${chapter.id}-title`}>{chapter.title}</h2>}<p className={styles.description}>{chapter.copy}</p></div>
              <div className={styles.visual}><Visual /></div>
              <div className={styles.sceneActions}><Link href="/login" prefetch={false} className={styles.primaryLink}>{index === 4 ? "Start your collection" : "Get started"}<ArrowRightIcon /></Link>{index === 4 ? <a className={styles.secondaryLink} href="/downloads/kivo-chrome-extension.zip" download>Chrome extension <LinkIcon size={15} /></a> : <button type="button" className={styles.secondaryLink} onClick={() => goTo(index + 1)}>{index === 0 ? "Take a look around" : "Keep exploring"}<ChevronDownIcon size={14} /></button>}</div>
              <p className={styles.sceneHint}>{index === 0 ? "A little less scattered. A lot more you." : index === 4 ? "On your phone. In your browser. Wherever curiosity takes you." : "Links, images, videos. All your little discoveries, together."}</p>
            </section>;
          })}
        </div>
        {chapters.map((chapter, index) => <div key={chapter.id} className={styles.snapPoint} style={{ top: `${index * 100}dvh` }} aria-hidden="true" />)}
      </div>
    </main>
    <footer className={styles.footer}>
      <div className={styles.footerNote}><span>© 2026 Kivo</span><span aria-hidden="true">·</span><a href="https://github.com/yemiSage/kivo" target="_blank" rel="noreferrer">Open source</a></div>
      <nav className={styles.chapterNav} aria-label="Explore Kivo">{chapters.map((chapter, index) => <button key={chapter.id} type="button" onClick={() => goTo(index)} aria-label={`${index + 1}. ${chapter.label}`} aria-current={active === index ? "step" : undefined}><span className={styles.chapterDot} /><span className={styles.chapterLabel}>{chapter.label}</span></button>)}</nav>
      <nav className={styles.legalLinks} aria-label="Legal"><Link prefetch={false} href="/welcome/privacy">Privacy</Link><span aria-hidden="true">·</span><Link prefetch={false} href="/welcome/terms">Terms of use</Link></nav>
    </footer>
  </div>;
}
