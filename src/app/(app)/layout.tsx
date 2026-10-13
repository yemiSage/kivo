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
    // At 360px wide the responsive frame inset resolves to 20px on every side.
    <div className="app-frame flex h-dvh overflow-hidden">
      <div className="shadow-float flex min-h-0 w-full overflow-hidden rounded-3xl border border-white/70 bg-shell">
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
