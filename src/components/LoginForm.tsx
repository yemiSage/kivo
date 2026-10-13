"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon } from "@/components/icons";

/** Passwordless email-link sign-in. */
export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);

    // The email template sends Supabase's token hash to /auth/confirm, where
    // the server verifies it and writes the SSR cookie session. This remains
    // reliable when the link opens in a different browser or installed PWA.
    const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { flowType: "implicit", persistSession: false, detectSessionInUrl: false },
    });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    setBusy(false);
    if (error) {
      setError(
        error.status === 429
          ? "Supabase’s built-in email limit has been reached. Try again one hour after the last email, or connect custom SMTP."
          : error.message,
      );
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-4" role="status">
        <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
          <CheckIcon size={20} variant="Bold" />
        </span>
        <div>
          <h2 className="font-semibold">Check your inbox</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            We sent a secure sign-in link to <span className="font-medium text-foreground">{email}</span>.
          </p>
        </div>
        <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={() => sendLink()}>
          {busy ? "Sending" : "Resend link"}
        </Button>
        <Button type="button" variant="link" className="h-auto self-center p-0 text-muted-foreground" onClick={() => setSent(false)}>
          Use another email
        </Button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={sendLink} className="flex flex-col gap-4">
      <div className="mb-[60px] flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(error)}
          aria-describedby="email-help"
        />
        <p id="email-help" className="text-xs text-muted-foreground">
          We’ll email you a secure sign-in link. No password needed.
        </p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "Sending link" : "Continue"}
      </Button>
    </form>
  );
}
