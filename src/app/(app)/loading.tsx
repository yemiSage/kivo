import { GridSkeleton, HeaderSkeleton } from "@/components/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Loading() {
  return (
    <div>
      <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full bg-background/90 p-2.5 text-foreground shadow-lg backdrop-blur">
        <LoadingSpinner label="Loading page" />
      </div>
      <HeaderSkeleton />
      <Skeleton className="mb-5 h-10 w-80 max-w-full rounded-xl" />
      <GridSkeleton />
    </div>
  );
}
