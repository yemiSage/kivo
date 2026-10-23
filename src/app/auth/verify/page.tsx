import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { emailOtpType, loginRecoveryPath } from "@/lib/email-auth";
import { safeNext } from "@/lib/safe-next";
import { BrandLogo } from "@/components/BrandLogo";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Confirm sign in", robots: { index: false, follow: false } };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const next = safeNext(typeof params.next === "string" ? params.next : null);
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash : "";
  const type = emailOtpType(params.type ?? "email");
  if (!tokenHash || tokenHash.length > 512 || !type) redirect(loginRecoveryPath("link", next));

  return (
    <main className="auth-screen pt-safe flex min-h-dvh items-center justify-center p-4">
      <div className="animate-rise w-full max-w-[400px] rounded-3xl bg-shell p-6 md:p-8">
        <BrandLogo className="mb-6" />
        <h1 className="text-xl font-semibold tracking-tight">Continue to Kivo</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Confirm that you requested this email to finish signing in.</p>
        <form action="/auth/confirm" method="post" className="mt-6">
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="next" value={next} />
          <button type="submit" className={buttonVariants({ className: "w-full" })}>Confirm sign in</button>
        </form>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Using the installed app? Enter the 6-digit code there instead. Use either the code or this link; both work once.</p>
        <a href={`/login?${new URLSearchParams({ next })}`} className="mt-5 inline-block text-sm underline underline-offset-4">Back to sign in</a>
      </div>
    </main>
  );
}
