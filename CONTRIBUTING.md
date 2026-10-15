# Contributing to Kivo

Thanks for helping improve Kivo. Documentation, reproducible bug reports, accessibility checks, tests and security work are as welcome as features. Read the [README](README.md), [code of conduct](CODE_OF_CONDUCT.md) and [security policy](SECURITY.md) first.

## Set up an isolated development environment

1. Install Node.js 24.x, npm and Git. Fork [yemiSage/kivo](https://github.com/yemiSage/kivo).
2. Clone your fork, add the upstream remote and install the lockfile:

   ```bash
   git clone https://github.com/YOUR-USERNAME/kivo.git
   cd kivo
   git remote add upstream https://github.com/yemiSage/kivo.git
   npm ci
   git switch -c codex/describe-your-change
   ```

3. Copy `.env.example` to `.env.local` only if that file does not already exist. See the README for Bash and PowerShell commands.
4. Create your own Supabase project. Apply all eight migrations in numeric order; configure six-digit email OTP, redirects and a template containing `{{ .Token }}`. Use only test accounts/content you control. The README explains every step and optional integration.
5. Set the public project URL/key and `NEXT_PUBLIC_SITE_URL`. Leave privileged integrations blank unless your change needs them. Never use the upstream production backend or credentials.
6. Run `npm run dev`, or `npm run dev -- -p 5000` after updating your local origin and auth allowlist.

You can run unit tests and a build without a live backend; this does not exercise login, RLS, storage or invitations. A functional app needs your own configured Supabase project.

## Choose and discuss work

Search existing issues/PRs before starting. Small, clear fixes can be submitted directly. For significant API, schema, storage, authentication, visual-system or dependency changes, describe the problem and proposed approach in an issue first. Security vulnerabilities belong in a private report, not a public issue. Maintainers review on a best-effort basis; there is no guaranteed response time.

Useful areas include cursor pagination, an independent tag index, database isolation tests, accessible browser tests, connection-pinned preview fetching, abuse controls and safe storage reconciliation. These are opportunities, not promises of an approved design or delivery date.

## Implementation conventions

- Keep changes focused and preserve unrelated local work. Do not reformat the whole repository for a small fix.
- Read [AGENTS.md](AGENTS.md) and the relevant installed `node_modules/next/dist/docs/` guide before framework changes. Next.js 16 uses `proxy.ts`; older tutorials can be incompatible.
- Use TypeScript and the established Tailwind tokens, Geist typography, Iconsax wrappers and Radix primitives. Maintain mobile-first behaviour and desktop breakpoints.
- Authenticate at action/data boundaries; browser visibility checks are not authorisation. Normal operations use the user's Supabase session and RLS, never a service-role bypass.
- Put server secrets only in server code and server environment variables. Do not log codes, tokens, cookies, signed URLs or invitation links.
- SQL changes go into a **new numbered migration**. Do not rewrite a migration already applied by other operators. State prerequisites, rollout/rollback considerations and data effects; avoid destructive defaults.
- Keep shared-vault access, immutable ownership and storage paths intact. Test owners, members and unrelated users separately.
- Add a focused regression test for changed pure logic. The current Biome configuration is a small correctness baseline, not a comprehensive React/accessibility rule set.
- Add dependencies only when justified, update `package-lock.json`, inspect licenses/advisories and explain why existing dependencies are insufficient.
- Update README/environment/setup/upgrade instructions with behaviour changes. Include asset provenance and third-party notices for new assets or copied source.

## Validate before submitting

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run check:docs
npm run check:secrets
npm run check:secrets:history
npm audit --audit-level=high
```

The credential scanner is a limited pattern check; manually inspect the diff and screenshots as well. `--history` checks reachable local Git refs, not all remote/deleted history. CI installs with `npm ci` on Node 24, runs these checks and must not require production secrets. Do not weaken checks just to make an unrelated failure disappear.

For UI work, verify 360px and 375px mobile widths plus desktop: long names, empty/error/loading states, focus/keyboard navigation, reduced motion, safe areas and no unintended horizontal overflow. For authentication, test link/code flows on your own backend. For PWA/share work, test a production build on a real HTTPS device; a desktop mobile viewport is not an installed app. When using browser automation, open a separate background tab instead of interrupting someone's active tab.

For database/security changes, provide a two-account owner/member test and an unrelated account rejection test, including direct API requests. Document anything you could not validate. Unit tests/build success do not prove deployed policies or email delivery.

## Submit a pull request

1. Review `git diff` and `git status`. Exclude `.env` files, test-user content, generated build output, logs and local credentials.
2. Make descriptive, focused commits and push your branch to your fork.
3. Open a PR against upstream `main`, completing the template: purpose, behaviour, tests/results, screenshots, migrations/config changes and known limits.
4. Link related issues. Explain breaking changes and provide upgrade steps rather than assuming maintainers will discover them.
5. Respond constructively to review; keep follow-up changes in the same PR. Do not force-push a shared branch without coordinating with its collaborators.

There is no CLA or DCO requirement configured here. By submitting a contribution, you affirm you have the right to submit it and license your original contribution under the project's MIT license, unless separately identified and agreed with the maintainer. Third-party material retains its original license. AI-assisted work must be reviewed, tested and rights-checked by its submitter; do not send secrets or customer data to tools.

## Credit

Git history and the [contributors graph](https://github.com/yemiSage/kivo/graphs/contributors) record actual contributions. If meaningful non-code contributions should be listed, propose a factual update to [CONTRIBUTORS.md](CONTRIBUTORS.md). Do not invent contributors or imply endorsement by upstream libraries/providers.
