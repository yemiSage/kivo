import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./BrandLogo";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
  crumbs = [],
  sticky = false,
  children,
  titleClassName,
  subtitleClassName,
}: {
  title: string;
  subtitle?: ReactNode;
  back?: string;
  action?: ReactNode;
  crumbs?: Crumb[];
  sticky?: boolean;
  children?: ReactNode;
  titleClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <div className={sticky ? "sticky top-0 z-30 -mx-4 bg-shell px-4 pb-1 md:-mx-8 md:px-8" : "contents"}>
      {/* Top bar: breadcrumb on desktop, brand + back on mobile */}
      <div className="sticky top-0 z-30 -mx-4 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-2 border-b bg-shell px-4 pt-[env(safe-area-inset-top)] md:static md:-mx-8 md:h-16 md:px-8 md:pt-0">
        {back ? (
          <Link href={back} aria-label="Back" className="-ml-2 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden">
            <ChevronLeftIcon size={20} />
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <BrandLogo height={32} />
          </Link>
        )}
        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[15px] text-muted-foreground md:flex">
          {[{ label: "Kivo", href: "/" }, ...crumbs].map((c, i, all) => (
            <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRightIcon size={14} className="shrink-0" />}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href} className="truncate hover:text-foreground">
                  {c.label}
                </Link>
              ) : (
                <span className={i === all.length - 1 ? "truncate text-foreground" : "truncate"}>{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">{action}</div>
      </div>

      <header className="mb-6">
        <div className="pt-[18px] md:pt-6">
          <h1 className={cn("break-all text-xl font-semibold leading-tight tracking-tight md:break-words md:text-[28px]", titleClassName)}>{title}</h1>
          {subtitle && <p className={cn("mt-1 text-sm text-muted-foreground md:text-[15px]", subtitleClassName)}>{subtitle}</p>}
        </div>
      </header>
      {children}
    </div>
  );
}
