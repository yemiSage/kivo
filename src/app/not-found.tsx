import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <div className="shadow-float w-full max-w-[400px] rounded-3xl border border-white/70 bg-shell p-8 text-center">
        <h1 className="text-xl font-semibold">Not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This item may have been deleted.</p>
        <Button asChild className="mt-6">
          <Link href="/">Back to library</Link>
        </Button>
      </div>
    </main>
  );
}
