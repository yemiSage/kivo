"use client";

import { useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "./LoadingSpinner";
import { EMAIL_REQUEST_KEY, EMAIL_RESEND_SECONDS, emailSendFailure, readPendingEmail, secondsUntil, type PendingEmailRequest } from "@/lib/email-auth";
import { safeNext } from "@/lib/safe-next";

const OTP_LENGTH = 6;

/** Passwordless email-link sign-in with a code fallback for isolated PWA storage. */
export function LoginForm({ next, linkError }: { next: string; linkError?: "link" | "browser" }) {
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");
	const [sent, setSent] = useState(false);
	const [busy, setBusy] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	const [codeError, setCodeError] = useState<string | null>(null);
	const [notice, setNotice] = useState(linkError);
	const [retryAt, setRetryAt] = useState(0);
	const [remaining, setRemaining] = useState(0);
	const working = useRef(false);
	const retryDeadline = useRef(0);
	const pendingRequest = useRef<PendingEmailRequest | null>(null);
	const emailInput = useRef<HTMLInputElement>(null);
	const codeInput = useRef<HTMLInputElement>(null);

	const rememberRequest = (request: PendingEmailRequest) => {
		pendingRequest.current = request;
		try { sessionStorage.setItem(EMAIL_REQUEST_KEY, JSON.stringify(request)); } catch { /* Optional in private browsers. */ }
	};

	const startCooldown = (deadline: number) => {
		retryDeadline.current = deadline;
		setRetryAt(deadline);
		setRemaining(secondsUntil(deadline));
	};

	useEffect(() => {
		try {
			const pending = readPendingEmail(sessionStorage.getItem(EMAIL_REQUEST_KEY));
			if (pending && safeNext(pending.next) === next) {
				pendingRequest.current = pending;
				setEmail(pending.email);
				setSent(true);
				retryDeadline.current = pending.retryAt;
				setRetryAt(pending.retryAt);
				setRemaining(secondsUntil(pending.retryAt));
			}
		} catch { /* Sign-in still works without session storage. */ }
	}, [next]);

	useEffect(() => {
		if (!retryAt) return;
		const update = () => setRemaining(secondsUntil(retryAt));
		update();
		const timer = window.setInterval(update, 1000);
		return () => window.clearInterval(timer);
	}, [retryAt]);

	useEffect(() => {
		if (window.matchMedia("(min-width: 48rem)").matches) {
			(sent ? codeInput : emailInput).current?.focus();
		}
	}, [sent]);

	const sendLink = async (e?: React.FormEvent) => {
		e?.preventDefault();
		if (working.current || secondsUntil(retryDeadline.current) > 0) return;
		working.current = true;
		setBusy(true);
		setSendError(null);
		try {
			const address = email.trim().toLowerCase();
			const { error } = await getBrowserSupabase().auth.signInWithOtp({
				email: address,
				options: {
					shouldCreateUser: true,
					// Keep the deployed redirect allowlist and old email templates
					// compatible. This page supports PKCE, implicit and token-hash links.
					emailRedirectTo: `${window.location.origin}/auth/implicit?next=${encodeURIComponent(next)}`,
				},
			});
			if (error) {
				const failure = emailSendFailure(error);
				setSendError(failure.message);
				const deadline = Date.now() + failure.retrySeconds * 1000;
				startCooldown(deadline);
				if (pendingRequest.current) rememberRequest({ ...pendingRequest.current, retryAt: deadline });
				return;
			}
			const sentAt = Date.now();
			const deadline = sentAt + EMAIL_RESEND_SECONDS * 1000;
			rememberRequest({ email: address, next, sentAt, retryAt: deadline });
			startCooldown(deadline);
			setEmail(address);
			setCode("");
			setCodeError(null);
			setNotice(undefined);
			const url = new URL(window.location.href);
			url.searchParams.delete("error");
			window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
			setSent(true);
		} catch {
			setSendError("We couldn’t connect. Check your internet connection and try again.");
		} finally {
			working.current = false;
			setBusy(false);
		}
	};

	const verifyCode = async (rawToken: string) => {
		const token = rawToken.replace(/\D/g, "");
		if (token.length !== OTP_LENGTH) {
			setCodeError("Enter the 6-digit code from your email.");
			return;
		}
		if (working.current) return;

		working.current = true;
		setBusy(true);
		setCodeError(null);
		let navigating = false;
		try {
			const { data, error: verifyError } =
				await getBrowserSupabase().auth.verifyOtp({
					email: email.trim(),
					token,
					type: "email",
				});

			if (verifyError || !data.session) {
				setCodeError(verifyError?.status === 429 ? "Too many attempts. Please wait a few minutes before trying this code again." : "That code is invalid or has expired. Enter the code from your latest email.");
				return;
			}
			try { sessionStorage.removeItem(EMAIL_REQUEST_KEY); } catch { /* Optional storage. */ }
			window.location.replace(next);
			navigating = true;
		} catch {
			setCodeError("We couldn’t connect. Check your internet connection and try again.");
		} finally {
			if (!navigating) {
				working.current = false;
				setBusy(false);
			}
		}
	};

	const submitCode = (e: React.FormEvent) => {
		e.preventDefault();
		void verifyCode(code);
	};

	const updateCode = (value: string) => {
		const nextCode = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
		setCode(nextCode);
		setCodeError(null);
		if (nextCode.length === OTP_LENGTH) void verifyCode(nextCode);
	};

	const linkNotice = notice && (
		<p role="status" className="rounded-lg bg-secondary px-3 py-2 text-sm leading-relaxed">
			{notice === "browser" ? "Open the email link in the browser where you requested it, or enter the 6-digit code in that browser or the installed Kivo app." : "This link couldn’t sign you in. Enter the code from your latest email, or request a new email if the link was already used or expired."}
		</p>
	);

	if (sent) {
		return (
			<div className="flex flex-col items-start gap-4">
				{linkNotice}
				<div role="status">
					<h2 className="font-semibold">Check your inbox</h2>
					<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
						We sent a sign-in link and code to{" "}
						<span className="font-medium text-foreground [overflow-wrap:anywhere]">{email}</span>.
					</p>
					<p className="mt-2 text-xs leading-relaxed text-muted-foreground">Use the most recent email. In the installed app, enter the code here.</p>
				</div>
				<form
					onSubmit={submitCode}
					className="flex w-full flex-col gap-3"
					aria-busy={busy}
				>
					<div className="flex flex-col gap-2">
						<Label htmlFor="email-code">6-digit code</Label>
						<Input
							id="email-code"
							ref={codeInput}
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							maxLength={OTP_LENGTH}
							required
							disabled={busy}
							value={code}
							onChange={(e) => updateCode(e.target.value)}
							placeholder="000000"
							className="text-center font-mono text-lg tracking-[0.35em]"
							aria-invalid={Boolean(codeError)}
							aria-describedby={codeError ? "code-error" : undefined}
						/>
					</div>
					{codeError && (
						<p id="code-error" role="alert" className="text-sm text-destructive">
							{codeError}
						</p>
					)}
					<Button type="submit" disabled={busy || code.length !== OTP_LENGTH}>
						{busy ? (
							<>
								<LoadingSpinner className="size-4" label="Signing in" /> Signing
								in…
							</>
						) : (
							"Sign in"
						)}
					</Button>
				</form>
				{sendError && <p role="alert" className="text-sm text-destructive">{sendError}</p>}
				<div className="flex w-full items-center justify-between gap-3">
					<Button
						type="button"
						variant="link"
						className="h-auto p-0 text-muted-foreground"
						disabled={busy || remaining > 0}
						onClick={() => sendLink()}
					>
						{remaining > 0 ? `Resend in ${remaining}s` : "Resend"}
					</Button>
					<Button
						type="button"
						variant="link"
						className="h-auto p-0 text-muted-foreground"
						disabled={busy}
						onClick={() => {
							setSent(false);
							setCode("");
							setCodeError(null);
							setSendError(null);
							pendingRequest.current = null;
							try { sessionStorage.removeItem(EMAIL_REQUEST_KEY); } catch { /* Optional storage. */ }
						}}
					>
						Change email
					</Button>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={sendLink} className="flex flex-col gap-4" aria-busy={busy}>
			{linkNotice}
			<div className="mb-10 flex flex-col gap-2 md:mb-[60px]">
				<Label htmlFor="email">Email</Label>
				<Input
					id="email"
					ref={emailInput}
					type="email"
					autoComplete="email"
					inputMode="email"
					required
					disabled={busy}
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="you@example.com"
					aria-invalid={false}
					aria-describedby="email-help"
				/>
				<p id="email-help" className="text-xs text-muted-foreground">
					We’ll email you a secure sign-in link and 6-digit code.
				</p>
				{sendError && (
					<p role="alert" className="text-sm text-destructive">
						{sendError}
					</p>
				)}
			</div>
			<Button type="submit" disabled={busy || remaining > 0}>
				{busy ? (
					<>
						<LoadingSpinner className="size-4" label="Sending link" /> Sending
						link…
					</>
				) : (
					remaining > 0 ? `Try again in ${remaining}s` : "Continue"
				)}
			</Button>
			<p className="text-xs leading-relaxed text-muted-foreground">
				By continuing, you confirm you are 18 or older and agree to our{" "}
				<a href="/welcome/terms" className="underline underline-offset-2">Terms of Use</a>.
				{" "}Read our <a href="/welcome/privacy" className="underline underline-offset-2">Privacy Policy</a>
				{" "}for how we handle your information.
			</p>
		</form>
	);
}
