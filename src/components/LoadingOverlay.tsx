import { LoadingSpinner } from "./LoadingSpinner";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" aria-busy="true">
      <LoadingSpinner className="h-14 w-32" label="Loading page" />
    </div>
  );
}
