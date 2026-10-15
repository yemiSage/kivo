# Security policy

Kivo is provided as-is. Public source, passing tests and a clean dependency audit are not guarantees of security or suitability for sensitive data.

## Supported versions

Security fixes target the current `main` branch on a best-effort basis. No older release support window, security SLA or bug bounty is offered. Operators are responsible for applying application/dependency updates, pending database migrations and provider configuration to their own deployments.

## Report privately

Do **not** publish credentials, working exploits, private user data, signed storage URLs or invitation tokens in public issues/PRs.

Prefer the repository's **Security → Report a vulnerability** private reporting flow when enabled. At the 2026-10-15 readiness check, GitHub private vulnerability reporting was **disabled**. The maintainer must enable it; merely adding this file does not do so. If the private report button is unavailable, request a private contact channel from [@yemiSage](https://github.com/yemiSage) without disclosing exploit details publicly. There is no separate verified security mailbox in this repository.

Include the affected revision/deployment, prerequisites, minimal steps using your own test data, expected/actual result, impact and a possible fix. Redact tokens and personal data. Coordinate disclosure and allow time for a fix; no response deadline is guaranteed. Test only systems you own or have explicit permission to assess. Do not access another user's data or disrupt the hosted service.

## Existing controls

- Supabase RLS for normal item/vault/storage access and session-based server mutations/search.
- Private media bucket, owner-prefixed upload paths, upload limits and short-lived URL-cache entries.
- Immutable item owner/storage path and destination-vault checks in migration `0008`.
- Same-origin session bridge checks, same-origin relative redirects and server-only privileged integrations.
- Admin allowlist before service-role metrics access; privileged RPCs restricted to service role.
- Preview URL protocol/host/IP checks, request time/body limits and restricted optimised-image hosts.
- Lockfile, dependency auditing, tests and a limited working-tree/history credential-pattern scanner.

Controls depend on actually applying all migrations and correct hosted configuration. The anon/publishable Supabase key is intended to be public; a service-role/secret key bypasses RLS and must never enter browser bundles, public environment variables, logs or Git.

## Known limits and operator responsibilities

Read [the readiness review](docs/OPEN_SOURCE_READINESS.md) for the complete current list. In particular:

- Metadata fetching validates DNS before fetching but does not pin the connection to the validated address. Use reviewed connection-pinned transport or network egress controls before running it in a sensitive/private network.
- Distributed per-user/IP rate limits, enforced storage quotas and automated safe orphan cleanup are not implemented. Provider limits are not an application abuse-control strategy.
- Automated tests do not currently run a full live multi-account RLS/auth/storage suite. Do not disable RLS to resolve an application error.
- Signed URLs are bearer credentials until expiry. Offline/browser copies can outlive a session or URL; local caching is not encryption, permanent backup or revocation of downloaded files.
- Preview sites receive network requests, Supabase stores account/content data, Brevo receives invitation data when enabled, and Gemini receives categorisation input when enabled. Publish an accurate deployment-specific privacy/retention policy.
- User data export/deletion UI, comprehensive retention management and end-to-end encryption are not implemented.

Use separate test/production backends, restrict privileged environment access, configure SMTP/redirect allowlists, protect deployment accounts, monitor usage and test backups/restores. Review outbound access and content processing for your hosting environment.

## Credential incidents

Rotate/revoke an exposed credential at its provider first, investigate access and replace dependent configuration. Removing it in a later commit does not remove Git history, forks, logs, caches or deployments. Coordinate any history rewrite rather than force-pushing shared branches without review.

`npm run check:secrets:history` scans selected formats in reachable local Git blobs; it is not a complete secret or personal-data detector. Check remote branches/artifacts and use dedicated platform secret scanning too. Never paste a real secret into a test to verify the scanner.
