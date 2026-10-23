# Email signup and sign-in repair

## Incident evidence — 23 October 2026

Read-only inspection of the Kivo Supabase dashboard confirmed:

- Custom SMTP is already enabled with Brevo, port 587. The project email allowance is 30/hour; the per-user interval is 60 seconds. No SMTP credentials or quotas were changed.
- Email signup and email confirmation are enabled; the hosted OTP is six digits and expires after 3,600 seconds.
- Auth logs showed a successful OTP email request at 09:06:03 and a resend at 09:06:12 rejected with `429: For security purposes, you can only request this after 50 seconds.` Kivo incorrectly labelled every 429 as the built-in hourly email quota. These are dashboard-displayed times.
- The hosted first-signup template contained only `ConfirmationURL`, without the visible OTP needed by the existing six-digit form.
- The installed `@supabase/ssr` browser client uses PKCE, while `/auth/implicit` originally accepted only fragment tokens. A valid query-code return could therefore display a false expired-link notice.

This is a focused authentication repair. Existing discoverability, vault permissions, RLS, admin authorization and account creation rules remain unchanged.

## Implementation

- Parse provider cooldown seconds; distinguish per-address cooldown, other rate limits and delivery/network failures without exposing raw provider errors.
- Disable repeated sends for 60 seconds after success. A synchronous request guard prevents duplicate sends/verifications. Email delivery errors do not mark the OTP input invalid or prevent code verification.
- Restore the pending email and cooldown after reload/back navigation using tab-scoped session storage, bounded to one hour. Codes and credentials are never stored there. Storage failure does not block authentication.
- Clear the old failed-link notice after a new email succeeds, and discard pending-email storage on sign out.
- Explicitly handle both PKCE query codes and older implicit fragment tokens. Disable competing automatic URL exchange and guard React effect re-entry. Preserve safe local destinations on recovery; explain cross-browser/PWA verification.
- Token-hash links lead through `/auth/confirm` GET to `/auth/verify`. Neither GET consumes the token. Only an explicit same-origin POST verifies it and establishes the normal Supabase session. Accepted purposes are email/signup/magiclink. Authentication pages use no-store and no-referrer policies.
- Maintained templates include both the OTP and a token-hash app link. Both sign-in methods are single-use. The installed app should use the code in its own storage context.

## Release dependency and rollout

Deploy the app before installing the new templates. Old `ConfirmationURL` emails remain supported through the repaired legacy handler. Do not disable email verification or remove rate limits.

After approval, in **Supabase → Authentication → Emails**:

1. Save the existing templates for rollback.
2. Set **Confirm sign up** body to [confirm-signup.html](../supabase/templates/confirm-signup.html).
3. Set **Magic link or OTP** body to [magic-link.html](../supabase/templates/magic-link.html).
4. Keep email OTP length at 6; check the configured expiry. Preserve working SMTP settings and keep provider link tracking disabled.
5. Keep the requesting app's `/auth/implicit?next=...` in the redirect allowlist. The verified production entry `https://kivo-save.vercel.app/**` already covers it. Templates intentionally use `RedirectTo`, retaining the requesting app origin and destination rather than hard-coding the older dashboard Site URL.
6. Request a fresh email with a controlled existing test account and a controlled new test account. Check code delivery, confirmation link, one-use behavior, resend countdown and private-route access. A consumed old link cannot be repaired retroactively.

Template files are repository sources, not automatically applied hosted configuration. Do not claim deployed delivery or successful signup from mocked tests. No real email is sent by the automated regression suite.

## Validation and remaining limits

Run `npm test`, `npm run test:auth:browser`, lint, typecheck, the production build, docs and secret checks. The browser suite mocks Auth responses and verifies flow/cookies, duplicate prevention, cooldown restoration, error recovery, mobile/desktop fit, GET safety and POST origin/type checks. It does not prove real email delivery or hosted RLS.

The cooldown is a UX safeguard. Supabase remains responsible for authoritative rate limiting, token verification and session security. Legitimate project/provider quotas can still be reached; capacity changes need provider review and approval. CAPTCHA or other abuse controls require a separate product/security decision.

### Validation record — 23 October 2026

| Check | Result |
| --- | --- |
| Unit/integration suite | 46 passed, including 11 new email-flow and server-confirmation tests; existing PostgreSQL ownership/quota tests passed |
| Auth browser suite, production build | Passed at 360, 375, 390 and 1440px; recovery and confirmation checked at 320px; mocked Auth, no real account creation/email |
| Manual browser review | In-app browser at 375×812; confirmation layout and labelled login input/keyboard focus checked |
| Lint / typecheck / production build | Passed |
| Public discoverability production regression | Passed |
| Markdown links | Passed |
| Working tree and reachable-history secret patterns | Zero findings; manual diff review also completed |
| Dependency audit | Zero vulnerabilities reported |
| Diff whitespace | Passed |
| Initial failures | Resolved: actual Host origin handling under Next normalization; browser test alert locator scoped away from Next's route announcer |

Accessibility evidence covers labelled controls, status/error separation, keyboard focus, readable mobile layout and no horizontal overflow in tested views. This is not a full assistive-technology audit. No new field performance/Core Web Vitals measurements were taken.

Local implementation is complete on `codex/fix-email-signup`. Production code release and the two hosted template replacements await approval. No remote branch, PR, merge, deployment, SMTP change, quota change, sitemap submission or provider verification was performed as part of this local repair. Existing dashboard access was sufficient for read-only diagnosis; no new credentials or ownership verification were needed. Real delivery, fresh-user signup and installed-device authentication remain release checks. API/agent/discoverability expansion is outside this incident's scope.

References: [Supabase rate limits](https://supabase.com/docs/guides/auth/rate-limits), [email templates and scanner behavior](https://supabase.com/docs/guides/auth/auth-email-templates), [passwordless email](https://supabase.com/docs/guides/auth/auth-email-passwordless), [Auth error codes](https://supabase.com/docs/guides/auth/debugging/error-codes).
