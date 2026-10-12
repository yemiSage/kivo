import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OfflineIcon } from "@/components/icons";

export const dynamic = "force-static";
export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="shadow-float w-full max-w-[400px] rounded-3xl border border-white/70 bg-shell p-8 text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary">
          <OfflineIcon size={24} />
        </span>
        <h1 className="text-xl font-semibold">You’re offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pages you’ve opened before still work. New saves will go through once you’re back online.</p>
        <Button asChild className="mt-6">
          <Link href="/">Go to library</Link>
        </Button>
      </div>
    </main>
  );
}
