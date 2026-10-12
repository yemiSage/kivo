import { Skeleton } from "@/components/ui/skeleton";

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border bg-card p-2">
          <Skeleton className="aspect-[4/3] rounded-xl" />
          <div className="space-y-2 px-1.5 pb-1.5 pt-3">
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="mb-6">
      <div className="-mx-4 flex h-14 items-center border-b px-4 md:-mx-8 md:h-16 md:px-8">
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="mt-8 h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-28" />
    </div>
  );
}
