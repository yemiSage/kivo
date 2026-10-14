import { cn } from "@/lib/utils";

export function LoadingSpinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className={cn("relative inline-flex size-5 shrink-0", className)}>
      <span className="absolute inset-0 rounded-full border-2 border-current opacity-15" />
      <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-r-current border-t-current" />
      <span className="absolute inset-[38%] animate-pulse rounded-full bg-current" />
    </span>
  );
}
