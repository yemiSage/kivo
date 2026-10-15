"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

/** Warm the full destination on intent, rather than every visible card at once. */
export function IntentLink({ onMouseEnter, onFocus, onTouchStart, ...props }: Omit<ComponentProps<typeof Link>, "prefetch">) {
  const [prefetch, setPrefetch] = useState(false);

  return (
    <Link
      {...props}
      prefetch={prefetch}
      onMouseEnter={(event) => { setPrefetch(true); onMouseEnter?.(event); }}
      onFocus={(event) => { setPrefetch(true); onFocus?.(event); }}
      onTouchStart={(event) => { setPrefetch(true); onTouchStart?.(event); }}
    />
  );
}
