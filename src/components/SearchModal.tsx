"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ItemView } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ItemThumb, sourceLabel } from "./ItemCard";
import { SearchIcon, XIcon } from "./icons";
import { LoadingSpinner } from "./LoadingSpinner";

export function SearchModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ItemView[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (!open || !value) {
      setItems([]);
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
        const body = (await response.json()) as { items?: ItemView[] };
        setItems(body.items ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setItems([]);
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
  }, [open, query]);

  const setOpen = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      setItems([]);
      setFailed(false);
    }
  };

  const searching = Boolean(query.trim());

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="top-[max(12px,env(safe-area-inset-top))] z-50 max-h-[calc(100dvh-24px)] max-w-[calc(100%-24px)] translate-y-0 gap-3 bg-transparent p-0 ring-0 shadow-none sm:max-w-lg"
      >
        <DialogTitle className="sr-only">Search your library</DialogTitle>
        <div className="flex h-12 items-center gap-2 rounded-2xl border bg-background px-3 shadow-lg">
          {loading ? <LoadingSpinner className="size-[19px]" label="Searching" /> : <SearchIcon size={19} className="text-muted-foreground" />}
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, notes, tags or sites"
            aria-label="Search your library"
            autoFocus
            autoComplete="off"
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground md:text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setQuery("")} aria-label="Clear search">
              <XIcon size={16} />
            </Button>
          )}
          <Button type="button" variant="ghost" size="sm" className="px-2" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>

        {searching && (
          <div className="max-h-[calc(100dvh-96px)] overflow-y-auto overscroll-contain rounded-2xl border bg-background p-2 shadow-lg" aria-live="polite">
            {loading ? (
              <div className="space-y-2 p-1" aria-label="Searching">
                {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-secondary" />)}
              </div>
            ) : failed ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">Search is unavailable. Try again.</p>
            ) : items.length ? (
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/item/${item.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl p-2 outline-none transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                        <ItemThumb item={item} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.title || sourceLabel(item) || "Untitled"}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{sourceLabel(item)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">No results for “{query.trim()}”.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
