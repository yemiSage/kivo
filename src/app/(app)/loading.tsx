import { GridSkeleton, HeaderSkeleton } from "@/components/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <HeaderSkeleton />
      <Skeleton className="mb-6 h-24 rounded-2xl" />
      <Skeleton className="mb-5 h-10 w-80 max-w-full rounded-xl" />
      <GridSkeleton />
    </div>
  );
}
