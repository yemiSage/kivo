"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { safeNext } from "@/lib/safe-next";
import { BrandLogo } from "@/components/BrandLogo";

export default function ImplicitAuthPage() {
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const finish = async () => {
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        window.location.replace("/login?error=link");
        return;
      }

      const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
        auth: { flowType: "implicit", persistSession: false, detectSessionInUrl: false },
      });
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) {
        window.location.replace("/login?error=link");
        return;
      }

      const response = await fetch("/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, refreshToken }),
      });
      if (!response.ok) {
        setMessage("We couldn’t finish signing you in. Request a new link.");
        return;
      }

      window.history.replaceState(null, "", "/auth/implicit");
      window.location.replace(next);
    };

    void finish();
  }, []);

  return (
    <main className="auth-screen pt-safe flex min-h-dvh items-center justify-center p-4">
      <div className="shadow-float animate-rise w-full max-w-[400px] rounded-3xl border border-white/70 bg-shell p-6 text-center md:p-8">
        <div className="mx-auto mb-5 flex w-fit items-center gap-2.5">
          <BrandLogo />
        </div>
        <p className="text-sm text-muted-foreground" role="status">{message}</p>
      </div>
    </main>
  );
}
