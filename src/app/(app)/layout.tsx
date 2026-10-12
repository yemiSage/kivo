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
    // Even canvas; the whole app floats on it as one rounded surface.
    <div className="flex min-h-dvh p-2 pt-[max(0.5rem,env(safe-area-inset-top))] md:h-dvh md:p-3 lg:p-4">
      <div className="shadow-float flex min-h-[calc(100dvh-1rem)] w-full overflow-hidden rounded-3xl border border-white/70 bg-shell md:min-h-0">
        <Sidebar email={email} collections={collections} />
        <div className="flex min-w-0 flex-1 flex-col">
          {!env.configured && (
            <div className="border-b bg-secondary px-4 py-2 text-center text-sm text-muted-foreground">
              Supabase isn’t configured. Copy <code className="font-mono">.env.example</code> to <code className="font-mono">.env.local</code> and add your keys.
            </div>
          )}
          <main className="flex-1 md:overflow-y-auto">
            <div className="mx-auto w-full max-w-5xl px-4 pb-32 md:px-8 md:pb-12">{children}</div>
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
