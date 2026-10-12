"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon } from "./icons";

export function SearchBox({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    const current = params.get("q") ?? "";
    if (value.trim() === current.trim()) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      next.delete("tag");
      start(() => router.replace(`${pathname}?${next}`, { scroll: false }));
    }, 250);
    return () => clearTimeout(t);
  }, [value, params, pathname, router]);

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-4 flex flex-col gap-2">
      <label htmlFor="q" className="text-sm font-medium">
        Search your library
      </label>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background pl-3 pr-1 transition focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15">
        <SearchIcon size={18} className={pending ? "animate-pulse text-foreground" : "text-muted-foreground"} />
        <input
          id="q"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Titles, notes, tags, sites"
          enterKeyHint="search"
          autoComplete="off"
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setValue("")} aria-label="Clear search">
            <XIcon size={16} />
          </Button>
        )}
      </div>
    </form>
  );
}
