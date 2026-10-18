"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { SearchCategory, SearchGroup, SearchResponse } from "@/lib/search";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IntentLink as Link } from "./IntentLink";
import { MediaThumbnail } from "./MediaThumbnail";
import { ArticleIcon, FolderIcon, HashIcon, ImageIcon, LinkIcon, SearchIcon, SettingsIcon, VideoIcon, XIcon } from "./icons";
import { LoadingSpinner } from "./LoadingSpinner";

export function SearchModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const searchQuery = query.trim();
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [resultQuery, setResultQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const value = searchQuery;
    if (!open || !value) {
      setGroups([]);
      setResultQuery("");
      setLoading(false);
      setFailed(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("search_failed");
        const body = (await response.json()) as SearchResponse;
        if (controller.signal.aborted) return;
        setGroups(body.groups ?? []);
        setResultQuery(value);
      } catch (error) {
        if (!controller.signal.aborted && (error as Error).name !== "AbortError") {
          setGroups([]);
          setResultQuery(value);
          setFailed(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, searchQuery]);

  const setOpen = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setGroups([]);
      setResultQuery("");
      setFailed(false);
    }
  };

  const searching = Boolean(query.trim());
  const busy = searching && (loading || resultQuery !== query.trim());
  const count = groups.reduce((sum, group) => sum + group.results.length, 0);

  const navigateResults = (event: KeyboardEvent<HTMLDivElement>) => {
    if (busy || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) return;
    const links = [...(resultsRef.current?.querySelectorAll<HTMLAnchorElement>("[data-search-result]") ?? [])];
    if (!links.length) return;
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = event.key === "ArrowDown" ? (index + 1) % links.length : index <= 0 ? links.length - 1 : index - 1;
      links[next].focus();
      links[next].scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && event.target === inputRef.current) {
      event.preventDefault();
      links[0].click();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          event.preventDefault();
          inputRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
        }}
        onKeyDown={navigateResults}
        className="top-[max(12px,env(safe-area-inset-top))] z-50 max-h-[calc(100dvh-24px)] max-w-[calc(100%-24px)] translate-y-0 gap-3 bg-transparent p-0 ring-0 shadow-none sm:max-w-lg"
      >
        <DialogTitle className="sr-only">Search your library</DialogTitle>
        <div className="flex h-12 items-center gap-2 rounded-2xl border bg-background px-3 shadow-lg">
          {busy ? <LoadingSpinner className="size-[19px]" label="Searching" /> : <SearchIcon size={19} className="text-muted-foreground" />}
          <input
            ref={inputRef}
            name="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your library and settings…"
            aria-label="Search tags, vaults, files, links, videos, images and settings"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground md:text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => { setQuery(""); inputRef.current?.focus(); }} aria-label="Clear search">
              <XIcon size={16} />
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" className="px-2" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>

        {searching && (
          <div ref={resultsRef} className="max-h-[calc(100dvh-96px)] overflow-y-auto overscroll-contain rounded-2xl border bg-background p-2 shadow-lg" aria-busy={busy}>
            <p className="sr-only" role="status" aria-live="polite">
              {busy ? "Searching…" : failed ? "Search is unavailable. Try again." : `${count} results in ${groups.length} categories`}
            </p>
            {busy ? (
              <div className="space-y-2 p-1" aria-label="Searching">
                {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-secondary" />)}
              </div>
            ) : failed ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">Search is unavailable. Try again.</p>
            ) : groups.length ? (
              groups.map((group) => {
                const Icon = CATEGORY_ICONS[group.id];
                return (
                  <section key={group.id} aria-label={group.label} className="border-b py-2 first:pt-0 last:border-0 last:pb-0">
                    <h3 className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                      <Icon size={14} /> {group.label}
                      <span className="ml-auto text-[10px] tabular-nums">{group.results.length}</span>
                    </h3>
                    <ul>
                      {group.results.map((result) => (
                        <li key={result.id}>
                          <Link
                            href={result.href}
                            data-search-result
                            onClick={() => setOpen(false)}
                            className="flex min-h-14 items-center gap-3 rounded-xl p-2 outline-none transition-colors hover:bg-secondary focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/40"
                          >
                            <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-muted-foreground">
                              {result.image ? (
                                <MediaThumbnail src={result.image} sizes="40px" className="h-full w-full object-cover" style={{ objectPosition: `${result.image_position_x ?? 50}% ${result.image_position_y ?? 50}%` }} />
                              ) : <Icon size={18} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium md:text-sm">{result.title}</p>
                              <p className="mt-1 truncate text-xs text-muted-foreground">{result.subtitle}</p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })
            ) : (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">No results for “{query.trim()}”.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const CATEGORY_ICONS: Record<SearchCategory, typeof SearchIcon> = {
  tags: HashIcon,
  vaults: FolderIcon,
  files: ArticleIcon,
  links: LinkIcon,
  videos: VideoIcon,
  images: ImageIcon,
  settings: SettingsIcon,
};
