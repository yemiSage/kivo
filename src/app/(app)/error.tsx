"use client";
import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/icons";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-24 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary">
        <WarningIcon size={24} />
      </span>
      <h2 className="font-semibold">This page didn’t load</h2>
      <p className="mt-1 text-sm text-muted-foreground">If you’re offline, pages you’ve opened before are still available.</p>
      <Button onClick={reset} className="mt-5">
        Try again
      </Button>
    </div>
  );
}
