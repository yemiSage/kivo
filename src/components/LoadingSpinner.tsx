import { cn } from "@/lib/utils";

/** SVG/CSS adaptation of Weifeng's loading animation; see docs/ASSETS.md. */
export function LoadingSpinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex size-5 shrink-0 items-center justify-center", className)}>
      <svg viewBox="74 123 140 60" className="h-full w-full overflow-visible" aria-hidden="true">
        <circle className="loading-dot loading-dot-green" cx="104.534" cy="153.386" r="16" fill="currentColor" />
        <circle className="loading-dot loading-dot-blue" cx="184.534" cy="153.386" r="16" fill="currentColor" />
      </svg>
    </span>
  );
}
