"use client";

import { useEffect, useRef } from "react";
import { safeNext } from "@/lib/safe-next";
import { BrandLogo } from "@/components/BrandLogo";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { EMAIL_REQUEST_KEY, finishEmailLink, loginRecoveryPath } from "@/lib/email-auth";

export default function ImplicitAuthPage() {
	const finishing = useRef(false);
	useEffect(() => {
		if (finishing.current) return;
		finishing.current = true;
		const finish = async () => {
			const next = safeNext(
				new URLSearchParams(window.location.search).get("next"),
			);
			const query = new URLSearchParams(window.location.search);
			// Updated templates may be used by an email requested from an older
			// app version. Forward its hash to the scanner-safe confirmation page.
			if (query.has("token_hash")) {
				window.location.replace(`/auth/confirm?${query}`);
				return;
			}
			try {
				const result = await finishEmailLink(getBrowserSupabase().auth, window.location.search, window.location.hash);
				// Remove credentials from browser history even when verification fails.
				window.history.replaceState(null, "", "/auth/implicit");
				if (result !== "ok") {
					window.location.replace(loginRecoveryPath(result, next));
					return;
				}
				try { sessionStorage.removeItem(EMAIL_REQUEST_KEY); } catch { /* Storage can be disabled. */ }
				window.location.replace(next);
			} catch {
				window.history.replaceState(null, "", "/auth/implicit");
				window.location.replace(loginRecoveryPath("link", next));
			}
		};

		void finish();
	}, []);

	return (
		<main className="auth-screen pt-safe flex min-h-dvh items-center justify-center p-4">
			<div className="shadow-float animate-rise w-full max-w-[400px] rounded-3xl border border-white/70 bg-shell p-6 text-center md:p-8">
				<div className="mx-auto mb-5 flex w-fit items-center gap-2.5">
					<BrandLogo />
				</div>
				<p className="text-sm text-muted-foreground" role="status">
					Signing you in…
				</p>
			</div>
		</main>
	);
}
