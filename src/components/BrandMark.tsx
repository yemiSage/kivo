import { cn } from "@/lib/utils";
import { BookmarkIcon } from "./icons";

export function BrandMark({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-[10px] bg-primary text-primary-foreground", className)}
      style={{ width: size, height: size }}
    >
      <BookmarkIcon size={size * 0.56} variant="Bold" />
    </span>
  );
}
