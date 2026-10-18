"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { DeferredSearch } from "./DeferredSearch";
import { FolderIcon, HomeIcon, PlusIcon, SearchIcon, UserIcon } from "./icons";

const TABS = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/collections", label: "Vaults", Icon: FolderIcon },
  { href: "/save", label: "Save", Icon: PlusIcon, primary: true },
  { href: "/search", label: "Search", Icon: SearchIcon },
  { href: "/profile", label: "Profile", Icon: UserIcon },
];

/** Mobile only: part of the app shell, pinned below the independently scrolling content. */
export function BottomNav() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("search") === "1" && window.matchMedia("(max-width: 47.999rem)").matches) setSearchOpen(true);
  }, []);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <nav aria-label="Primary" className="sticky bottom-0 z-40 shrink-0 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
        <ul className="mx-auto flex h-16 w-full items-center justify-around rounded-none border-0 bg-white px-2">
          {TABS.map(({ href, label, Icon, primary }) => {
            const active = href === "/search" ? searchOpen : isActive(href);
            const classes = cn(
              "flex h-14 w-full max-w-16 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-medium outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-ring/40",
              active ? "text-foreground" : "text-muted-foreground",
              primary && "text-[#353535]",
            );
            const content = (
              <>
                <span className={cn("flex size-8 items-center justify-center rounded-full", primary && "size-10 bg-[#d3d2d2]")}>
                  <Icon size={primary ? 22 : 20} variant={active && !primary ? "Bold" : "Bulk"} />
                </span>
                <span className={primary ? "sr-only" : undefined}>{label}</span>
              </>
            );
            return (
              <li key={href} className="flex flex-1 justify-center">
                {href === "/search" ? (
                  <button type="button" aria-label="Search" aria-pressed={searchOpen} className={classes} onClick={() => setSearchOpen(true)}>
                    {content}
                  </button>
                ) : (
                  <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={classes}>
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <DeferredSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
