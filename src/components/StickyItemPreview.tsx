"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** Keep the preview below the pinned heading, including wrapped titles. */
export function StickyItemPreview({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const preview = ref.current;
    const header = preview?.parentElement?.previousElementSibling;
    if (!preview || !header) return;
    const measure = () => preview.style.setProperty("--item-header-height", `${header.getBoundingClientRect().height}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[var(--item-header-height,180px)] lg:self-start">{children}</div>;
}
