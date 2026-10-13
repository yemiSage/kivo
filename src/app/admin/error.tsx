"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="shadow-float max-w-md rounded-3xl border border-white/70 bg-shell p-6 text-center">
        <h1 className="text-xl font-semibold">Admin metrics unavailable</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Check the server-side Supabase service key and apply the latest database migration, then try again.
        </p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
