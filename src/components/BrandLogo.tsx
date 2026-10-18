import { cn } from "@/lib/utils";

/** Custom rounded lettering stays consistent across devices without a font download. */
export function BrandLogo({ className, height = 36 }: { className?: string; height?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 98 44"
      width={height * 98 / 44}
      height={height}
      fill="none"
      role="img"
      aria-label="Kivo"
      className={cn("shrink-0 text-foreground", className)}
    >
      <g stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 7v27m16-20-9 8a3 3 0 0 0 0 4l9 8M34 18v16m10-16 7 13c1.6 3.2 4.4 3.2 6 0l7-13" />
        <circle cx="80" cy="25" r="9" />
      </g>
      <circle cx="34" cy="8" r="3" fill="currentColor" />
    </svg>
  );
}
