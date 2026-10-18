"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut } from "@/app/actions";
import type { Collection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BrandLogo } from "./BrandLogo";
import { DeferredSearch } from "./DeferredSearch";
import {
  BookmarkIcon,
  ChevronDownIcon,
  FolderIcon,
  HomeIcon,
  LogoutIcon,
  PlusIcon,
  SearchIcon,
  UserIcon,
} from "./icons";

const MAIN = [
  { href: "/", label: "Library", Icon: HomeIcon },
  { href: "/collections", label: "Vaults", Icon: FolderIcon },
  { href: "/save", label: "Save", Icon: BookmarkIcon },
  { href: "/search", label: "Search", Icon: SearchIcon },
];

function NavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg px-3 text-[15px] transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-foreground shadow-[0_1px_2px_rgb(40_40_30/0.06),0_0_0_1px_rgb(40_40_30/0.04)]"
          : "text-sidebar-foreground/80 hover:bg-black/[0.03] hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function Sidebar({ email, collections }: { email: string | null; collections: Pick<Collection, "id" | "name">[] }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("search") === "1" && window.matchMedia("(min-width: 48rem)").matches) setSearchOpen(true);
  }, []);
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandLogo />
        </Link>
      </div>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-1.5 pt-3 text-xs font-medium text-muted-foreground">Main</p>
        <ul className="space-y-0.5">
          {MAIN.map(({ href, label, Icon }) => {
            const active = href === "/search" ? searchOpen : href === "/collections" ? pathname === "/collections" : isActive(href);
            return (
              <li key={href}>
                {href === "/search" ? (
                  <button
                    type="button"
                    aria-pressed={searchOpen}
                    onClick={() => setSearchOpen(true)}
                    className={cn(
                      "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[15px] transition-colors",
                      active
                        ? "bg-sidebar-accent font-medium text-foreground shadow-[0_1px_2px_rgb(40_40_30/0.06),0_0_0_1px_rgb(40_40_30/0.04)]"
                        : "text-sidebar-foreground/80 hover:bg-black/[0.03] hover:text-foreground",
                    )}
                  >
                    <Icon size={20} className={active ? "text-foreground" : "text-muted-foreground"} />
                    {label}
                  </button>
                ) : (
                  <NavLink href={href} active={active}>
                    <Icon size={20} className={active ? "text-foreground" : "text-muted-foreground"} />
                    {label}
                  </NavLink>
                )}
              </li>
            );
          })}
        </ul>

        <div className="my-4 h-px bg-sidebar-border" />

        <p className="px-3 pb-1.5 text-xs font-medium text-muted-foreground">Vaults</p>
        <ul className="space-y-0.5">
          {collections.map((c) => {
            const href = `/collections/${c.id}`;
            const active = pathname === href;
            return (
              <li key={c.id}>
                <NavLink href={href} active={active}>
                  <FolderIcon size={18} className={active ? "text-foreground" : "text-muted-foreground"} />
                  <span className="truncate">{c.name}</span>
                </NavLink>
              </li>
            );
          })}
          <li>
            <Link
              href="/collections?new=1"
              className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground hover:bg-black/[0.03] hover:text-foreground"
            >
              <PlusIcon size={18} />
              New vault
            </Link>
          </li>
        </ul>
      </nav>

      {email && (
        <div className="border-t border-sidebar-border p-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-12 w-full items-center gap-3 rounded-lg px-2 text-left outline-none hover:bg-black/[0.03] focus-visible:ring-2 focus-visible:ring-ring/40">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground">{email[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{email}</span>
              <ChevronDownIcon size={16} className="text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserIcon size={16} /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  navigator.serviceWorker?.controller?.postMessage("clear-user-cache");
                  void signOut();
                }}
              >
                <LogoutIcon size={16} /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      <DeferredSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </aside>
  );
}
