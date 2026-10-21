import { LoadingSpinner } from "./LoadingSpinner";

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" aria-busy="true">
      <LoadingSpinner className="size-5 text-primary" label="Loading page" />
    </div>
  );
}
