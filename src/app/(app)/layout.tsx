import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/Sidebar";
import { env } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Collection } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let email: string | null = null;
  let collections: Pick<Collection, "id" | "name">[] = [];
  if (env.configured) {
    const supabase = await getServerSupabase();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      email = data.user.email ?? null;
      const res = await supabase.from("collections").select("id, name").order("created_at");
      collections = res.data ?? [];
    }
  }

  return (
    // Mobile is edge-to-edge; desktop keeps the floating framed workspace.
    <div className="app-frame flex h-dvh overflow-hidden">
      <div className="flex min-h-0 w-full overflow-hidden bg-shell md:rounded-3xl md:border md:border-white/70 md:shadow-[0_1px_2px_rgb(40_40_30/0.04),0_12px_40px_-12px_rgb(40_40_30/0.14)]">
        <Sidebar email={email} collections={collections} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          {!env.configured && (
            <div className="border-b bg-secondary px-4 py-2 text-center text-sm text-muted-foreground">
              Supabase isn’t configured. Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env.local</code> and add your keys.
            </div>
          )}
          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-4 pb-6 md:px-8 md:pb-12">{children}</div>
          </main>
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
