import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className, size = 32 }: { className?: string; size?: number }) {
  return <Image src="/brand/kivo-mark.png" alt="Kivo" width={size} height={size} unoptimized className={cn("inline-block shrink-0", className)} />;
}
