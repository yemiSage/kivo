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

/** Mobile only: a floating pill above the canvas. Desktop uses the sidebar. */
export function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav aria-label="Primary" className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-3 md:hidden">
      <ul className="shadow-float pointer-events-auto mx-auto flex h-16 max-w-sm items-center justify-around rounded-[28px] border border-black/[0.04] bg-white/90 px-2 backdrop-blur-xl">
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
                  primary ? "size-11 bg-primary text-primary-foreground" : "size-10",
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
