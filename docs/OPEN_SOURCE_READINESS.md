# Open-source readiness review

Review date: **2026-10-15**. Scope: repository source, configuration, tracked/reachable history, assets, dependency metadata, database policies, onboarding and contributor workflow. This is an engineering readiness review, not a penetration test, legal opinion or certification.

## Conclusion

Kivo can be shared as an MIT-licensed project with the documentation and notices added in this working tree. The GitHub repository was already public at the time of review; public visibility alone did not previously grant a reusable open-source license. The maintainer selected MIT. Forks need their **own** Supabase/backend/email/deployment configuration.

The current generated background replaces the third-party photograph in the current tree. Dependencies, fonts and historical assets retain their own terms. Complete release-artifact license review and production hardening remain operator responsibilities. Do not describe the app as fully audited, copyright-free, end-to-end encrypted or safe for unlimited anonymous/public usage.

These are local changes, not evidence of a GitHub push, successful hosted CI, applied SQL or a new production deployment.

## Readiness work included

- Full MIT text and package license/repository metadata.
- Detailed README: clone/fork, Windows/Bash setup, environment variables, all eight ordered migrations, Auth templates/settings, integrations, storage, PWA, deployment, testing and troubleshooting.
- Contribution, contributor-credit, conduct and security-reporting documents; PR/issue templates and CODEOWNERS.
- Node 24 runtime pins, reproducible npm lockfile, explicit Biome correctness baseline and Linux/Windows CI workflow using pinned actions with read-only permissions and no production credentials.
- Local Markdown path checker and redacted working-tree/reachable-history credential-pattern scanner.
- Third-party inventory, preserved font/component/icon notices and generated-background provenance/prompt.
- Sign-in redirect normalisation fix and regression tests for control characters/backslashes/external origins.
- New migration `0008_check_vault_update_destination.sql`: item owners must have access to the destination vault too, rather than bypassing that check through ownership.
- PWA search shortcut corrected from a nonexistent `/search` page to `/?search=1`, opening the responsive search modal.

## Evidence and verification

| Check | Result / boundary |
| --- | --- |
| Repository visibility | GitHub API reported `PUBLIC` for `yemiSage/kivo`; visibility was not changed. |
| Private vulnerability reporting | GitHub API reported `enabled: false`; not changed. Enable it in repository settings. |
| Current environment files | `.env.example` is tracked; `.env.local` is ignored. No real environment file was found in the inspected tracked history. This is not proof that secrets were never exposed elsewhere. |
| Credential-pattern scan | Zero matches in working files and 219 reachable history blobs during review. The script reports locations/rules only. Re-run on the final release revision. |
| Dependency audit | `npm audit --audit-level=high` reported zero known vulnerabilities after updating sharp to 0.35.5. Advisories can change; re-run before releasing. |
| Local lint/types/tests | Biome baseline, TypeScript and all 11 unit/regression tests passed. Tests cover search grouping/limits, redirects and session-scoped signed-URL cache isolation/expiry/bounds. |
| Local production build | Next.js production build passed. It does not apply SQL or validate hosted permissions/SMTP. |
| Source/diff checks | `git diff --check` passed. Local Markdown paths are checked by `npm run check:docs`. |
| Clean dependency/build smoke test | Passed `npm ci` and `npm run build` on Node 24 in an isolated source copy without `.env.local`, existing `node_modules` or build output. This was a working-source snapshot, not a clone of an already-published release commit. |
| Hosted database, SMTP, installed devices | Not newly verified by this review. Migration `0008` has not been applied to hosted Supabase. |
| CI | Workflow provided; no hosted run claimed before it is committed/pushed and GitHub executes it. Linux execution is not locally verified on this Windows machine. |

The scan covers selected key/token/private-key patterns and service-role JWTs. It skips binary content, rejects oversized history blobs and cannot detect every generic secret, photograph, private identifier or inaccessible/deleted remote object. Manually inspect assets, remote branches, build artifacts, logs, screenshots and deployment variables too. A clean scan is not a reason to skip provider/platform scanning.

## Remaining security and scale work

| Area | Current limit | Required direction before higher-risk deployment |
| --- | --- | --- |
| Outbound metadata requests | DNS checks happen before a separately resolved fetch connection. A rebinding window remains. | Use reviewed connection-pinned transport and/or hosting-level egress restrictions; block private/link-local/metadata networks at the network boundary. Do not run this fetcher on a sensitive/private network without those controls. |
| Abuse controls | No distributed per-account/IP rate limits for preview, search, saves or invites. | Add shared-store rate limiting, provider budget limits, monitoring and backoff appropriate to your host. |
| Storage lifecycle | Per-upload 5 MiB limit, but no enforced per-user byte quota; failed sequences/shared-member deletions can orphan objects. | Enforce account quotas and implement privileged reconciliation with complete database/storage evidence, dry runs, retention and recovery. Never delete from an incomplete client view. |
| Data isolation tests | RLS SQL reviewed; no automated full multi-account database suite. | Apply pending migrations to staging and test owner/member/outsider reads, updates, moves, storage and invites via direct API calls. |
| Local/offline privacy | Previously visited content/images may be cached on a device. Signed URLs and downloaded bytes have different lifetimes. | Explain local storage/privacy, test sign-out clearing and shared-device behaviour; do not promise remote revocation of downloaded data. |
| Browser policy | CSP still allows inline scripts/styles and broad HTTPS connections/media for the current stack. | Evaluate nonce-based script policy and narrower destinations without breaking Next.js, Supabase or previews. Headers alone are not an XSS audit. |
| Accounts/retention | No complete user export/deletion UI, privacy/retention programme or restore exercise included. | Implement deployment-specific privacy, deletion/backup handling and tested restore procedures. |
| Availability | Provider outages, slow previews and serverless cold starts remain possible. | Instrument real production request timings/errors without logging content/tokens; set budgets and alerts before claiming latency improvements. |

## Release and community follow-up

1. Apply `0008` to the correct backed-up/staging project and verify destination-vault rejection; apply to production through the operator's normal process. Do not rerun initial migrations blindly.
2. Enable GitHub private vulnerability reporting, secret scanning/push protection where available and appropriate branch review protections. Files in this repo do not configure those settings.
3. Validate generated asset provenance and all relevant dependency/bundled notices for the actual distributed release. Do not apply MIT to older Unsplash revisions or user content.
4. Run the documented validation commands and CI against the final commit; verify a fresh checkout and an independently configured backend, not just a local build with existing `.env.local`.
5. Test six-digit OTP/new signup, actual email delivery, sharing, policy isolation, mobile accessibility and installed PWA behaviour with your own accounts/devices.
6. Record release revision, migrations, known limits and upgrade steps. Avoid claiming completion for hosted state that has not been observed.

## Validation note

An isolated copy of tracked/non-ignored working-source files installed 141 packages from the lockfile using `npm ci` and completed a production build without a local environment file or production credentials. The working copy separately passed lint, type checking, all 11 tests, local Markdown path checks, secret-pattern checks, dependency audit and whitespace checks. These results are a dated snapshot; re-run against the final commit and supported CI platforms. They do not claim an end-to-end authenticated test, hosted migration, new deployment or real-device test.
