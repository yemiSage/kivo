import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { env } from "@/lib/env";
import { LoginForm } from "@/components/LoginForm";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  if (env.configured) {
    const supabase = await getServerSupabase();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect(next);
  }

  return (
    <main className="pt-safe flex min-h-dvh items-center justify-center p-4">
      <div className="shadow-float animate-rise w-full max-w-[400px] rounded-3xl border border-white/70 bg-shell p-6 md:p-8">
        <div className="mb-5 flex items-center gap-2.5">
          <BrandMark />
          <span className="text-lg font-semibold tracking-tight">Kivo</span>
        </div>
        {sp.error === "link" && (
          <p role="alert" className="mt-5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            That sign-in link expired or was already used. Request a new link.
          </p>
        )}
        {next.startsWith("/save?") && (
          <p className="mt-5 rounded-lg bg-secondary px-3 py-2 text-sm">Sign in and we’ll save what you shared.</p>
        )}

        <div>
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
