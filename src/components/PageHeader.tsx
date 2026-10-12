import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "./BrandMark";
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
}: {
  title: string;
  subtitle?: ReactNode;
  back?: string;
  action?: ReactNode;
  crumbs?: Crumb[];
}) {
  return (
    <header className="mb-6">
      {/* Top bar: breadcrumb on desktop, brand + back on mobile */}
      <div className="-mx-4 flex h-14 items-center gap-2 border-b px-4 md:-mx-8 md:h-16 md:px-8">
        {back ? (
          <Link href={back} aria-label="Back" className="-ml-2 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground md:hidden">
            <ChevronLeftIcon size={20} />
          </Link>
        ) : (
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <BrandMark size={28} />
            <span className="font-semibold tracking-tight">Kivo</span>
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

      <div className="pt-6 md:pt-8">
        <h1 className="text-[26px] font-semibold leading-tight tracking-tight md:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>}
      </div>
    </header>
  );
}
