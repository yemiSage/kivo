"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SearchModal = dynamic(() => import("./SearchModal").then((module) => module.SearchModal), {
  loading: () => (
    <div role="status" className="fixed left-1/2 top-[max(12px,env(safe-area-inset-top))] z-50 w-[calc(100%-24px)] max-w-lg -translate-x-1/2 rounded-2xl border bg-background px-4 py-3 text-sm shadow-lg">
      Opening search…
    </div>
  ),
});

/** First click loads search; retaining it afterwards preserves focus/close behaviour. */
export function DeferredSearch(props: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [openedOnce, setOpenedOnce] = useState(false);
  useEffect(() => { if (props.open) setOpenedOnce(true); }, [props.open]);
  return props.open || openedOnce ? <SearchModal {...props} /> : null;
}
