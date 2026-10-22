import { LoadingSpinner } from "./LoadingSpinner";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" aria-busy="true">
      <LoadingSpinner className="h-[60px] w-[140px] text-primary" label="Loading page" />
    </div>
  );
}
