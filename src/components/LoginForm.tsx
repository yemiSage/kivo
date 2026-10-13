"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon } from "@/components/icons";

/** Passwordless email-link sign-in with a code fallback for isolated PWA storage. */
export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authClient = () =>
    createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { flowType: "implicit", persistSession: false, detectSessionInUrl: false },
    });

  const sendLink = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(null);

    // The link is convenient where the OS routes it into the installed PWA.
    // The visible OTP is the cross-browser fallback (notably for iOS PWAs).
    const supabase = authClient();
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
    setCode("");
    setSent(true);
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setBusy(true);
    setError(null);
    const { data, error: verifyError } = await authClient().auth.verifyOtp({
      email: email.trim(),
      token,
      type: "email",
    });

    if (verifyError || !data.session) {
      setBusy(false);
      setError(verifyError?.message ?? "That code is invalid or has expired.");
      return;
    }

    const response = await fetch("/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      }),
    });

    if (!response.ok) {
      setBusy(false);
      setError("We couldn’t finish signing you in. Request a new code.");
      return;
    }

    window.location.replace(next);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-4">
        <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-foreground">
          <CheckIcon size={20} variant="Bold" />
        </span>
        <div role="status">
          <h2 className="font-semibold">Check your inbox</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            We sent a sign-in link and code to <span className="font-medium text-foreground">{email}</span>.
          </p>
        </div>
        <form onSubmit={verifyCode} className="flex w-full flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email-code">6-digit code</Label>
            <Input
              id="email-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="text-center font-mono text-lg tracking-[0.35em]"
              aria-invalid={Boolean(error)}
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              In the installed app, enter the code here. You can also tap the link in your email on supported devices.
            </p>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy || code.length !== 6}>
            {busy ? "Signing in" : "Sign in"}
          </Button>
        </form>
        <div className="flex w-full items-center justify-between gap-3">
          <Button type="button" variant="link" className="h-auto p-0 text-muted-foreground" disabled={busy} onClick={() => sendLink()}>
            Resend
          </Button>
          <Button type="button" variant="link" className="h-auto p-0 text-muted-foreground" disabled={busy} onClick={() => setSent(false)}>
            Change email
          </Button>
        </div>
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
