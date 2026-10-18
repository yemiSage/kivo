import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { env } from "@/lib/env";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(typeof sp.next === "string" ? sp.next : null);
  if (env.configured) {
    const { user } = await getAuthenticatedUser();
    if (user) redirect(next);
  }

  return (
    <main className="auth-screen pt-safe flex min-h-dvh items-center justify-center p-4">
      <div className="animate-rise w-full max-w-[400px] rounded-3xl border-0 bg-shell p-6 shadow-none md:border md:border-white/70 md:p-8 md:shadow-[0_1px_2px_rgb(40_40_30/0.04),0_12px_40px_-12px_rgb(40_40_30/0.14)]">
        <h1 className="mb-5 text-xl font-semibold leading-tight tracking-tight">Get into your account</h1>
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
