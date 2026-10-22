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
        <ToggleGroup type="single" value={layout} onValueChange={setLayout} aria-label="View layout" spacing={1} className="rounded-xl border bg-secondary p-1">
          <ToggleGroupItem value="grid" aria-label="Grid view" title="Grid view" className="h-9 gap-1.5 rounded-lg px-3 data-[state=on]:bg-background data-[state=on]:text-foreground">
            <GridIcon size={16} /> <span className="text-xs">Grid</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List view" title="List view" className="h-9 gap-1.5 rounded-lg px-3 data-[state=on]:bg-background data-[state=on]:text-foreground">
            <ListIcon size={16} /> <span className="text-xs">List</span>
          </ToggleGroupItem>
        </ToggleGroup>
  );
}

export function ContentLayout({ children, showControl = true }: { children: ReactNode; showControl?: boolean }) {
  const layout = useSyncExternalStore(subscribe, getLayout, () => "grid");
  return (
    <div className="group/layout min-w-0" data-layout={layout}>
      {showControl && <div className="mb-4 flex justify-end">
        <LayoutSwitch />
      </div>
      }
      {children}
    </div>
  );
}
