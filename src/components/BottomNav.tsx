"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav aria-label="Primary" className="sticky bottom-0 z-40 shrink-0 bg-shell px-3 pb-3 pt-2 md:hidden">
      <ul className="mx-auto flex h-16 w-full items-center justify-around rounded-2xl border border-black/[0.04] bg-secondary/70 px-2">
        {TABS.map(({ href, label, Icon, primary }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex flex-1 justify-center">
              <Link
                href={href}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-center rounded-full outline-none transition active:scale-95 focus-visible:ring-2 focus-visible:ring-ring/40",
                  primary ? "size-11 bg-[#d3d2d2] text-[#353535]" : "size-10",
                  !primary && (active ? "bg-secondary text-foreground" : "text-muted-foreground"),
                )}
              >
                <Icon size={primary ? 22 : 22} variant={active && !primary ? "Bold" : "Bulk"} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
