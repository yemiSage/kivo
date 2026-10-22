"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { GridIcon, ListIcon } from "./icons";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

type Layout = "grid" | "list";
const STORAGE_KEY = "kivo:content-layout:v1";
const CHANGE_EVENT = "kivo:content-layout-change";
let fallback: Layout = "grid";

function getLayout(): Layout {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "list" || stored === "grid" ? stored : fallback;
  } catch {
    return fallback;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function setLayout(value: string) {
  if (value !== "grid" && value !== "list") return;
  fallback = value;
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Still works for this session. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Keep cards server-rendered; only the layout control needs client state. */
export function LayoutSwitch() {
  const layout = useSyncExternalStore(subscribe, getLayout, () => "grid");
  return (
        <ToggleGroup type="single" value={layout} onValueChange={setLayout} aria-label="View layout" spacing={0.5} className="h-10 rounded-xl border border-transparent bg-transparent p-1 md:border-border md:bg-secondary">
          <ToggleGroupItem value="grid" aria-label="Grid view" title="Grid view" className="h-8 gap-1 rounded-lg px-3 text-muted-foreground md:gap-1.5 aria-pressed:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-foreground md:aria-pressed:bg-background md:data-[state=on]:bg-background md:data-[state=on]:shadow-[0_1px_2px_rgb(40_40_30/0.08)]">
            <GridIcon size={16} /> <span className="text-xs">Grid</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" title="List view" className="h-8 gap-1 rounded-lg px-3 text-muted-foreground md:gap-1.5 aria-pressed:bg-transparent data-[state=on]:bg-transparent data-[state=on]:text-foreground md:aria-pressed:bg-background md:data-[state=on]:bg-background md:data-[state=on]:shadow-[0_1px_2px_rgb(40_40_30/0.08)]">
            <ListIcon size={16} /> <span className="text-xs">List</span>
          </ToggleGroupItem>
        </ToggleGroup>
  );
}

export function ContentLayout({ children, showControl = true }: { children: ReactNode; showControl?: boolean }) {
  const layout = useSyncExternalStore(subscribe, getLayout, () => "grid");
  return (
    <div className="group/layout min-w-0" data-layout={layout}>
      {showControl && <div className="mb-4 flex justify-start md:justify-end">
        <LayoutSwitch />
      </div>
      }
      {children}
    </div>
  );
}
