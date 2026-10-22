import { Suspense } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { env } from "@/lib/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import type { Collection } from "@/lib/types";

async function AppSidebar() {
  let email: string | null = null;
  let collections: Pick<Collection, "id" | "name">[] = [];
  if (env.configured) {
    const { supabase, user } = await getAuthenticatedUser();
    if (user) {
      email = user.email ?? null;
      const res = await supabase.from("collections").select("id, name").order("created_at");
      collections = res.data ?? [];
    }
  }

  return <Sidebar email={email} collections={collections} />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    // Mobile is edge-to-edge; desktop keeps the floating framed workspace.
    <div className="app-frame flex h-dvh overflow-hidden">
      <a href="#main-content" className="sr-only fixed left-3 top-3 z-[100] rounded-lg bg-primary px-3 py-2 text-primary-foreground focus:not-sr-only">
        Skip to content
      </a>
      <div className="flex min-h-0 min-w-0 w-full overflow-hidden bg-shell md:rounded-3xl md:border md:border-white/70 md:shadow-[0_1px_2px_rgb(40_40_30/0.04),0_12px_40px_-12px_rgb(40_40_30/0.14)]">
        <Suspense fallback={<Sidebar email={null} collections={[]} />}>
          <AppSidebar />
        </Suspense>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!env.configured && (
            <div className="border-b bg-secondary px-4 py-2 text-center text-sm text-muted-foreground">
              Supabase isn’t configured. Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env.local</code> and add your keys.
            </div>
          )}
          <main id="main-content" tabIndex={-1} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pb-6 md:px-8 md:pb-12">{children}</div>
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
