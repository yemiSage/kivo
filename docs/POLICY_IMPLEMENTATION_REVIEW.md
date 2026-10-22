# Privacy and terms implementation review

Reviewed 22 October 2026 against the local source. Operator details were supplied by the owner: MaestroTG, Lagos, Nigeria; adegboyeopeyemiazeez@gmail.com. This review checks descriptions against implementation, not legal enforceability or provider account settings.

## Confirmed in the source

| Policy subject | Implementation and boundary |
| --- | --- |
| Sign-in | Email links and OTP in `src/components/LoginForm.tsx`; terms/privacy notice shown before Continue. No date-of-birth or age verification, and no versioned terms-acceptance ledger. An 18+ condition is a service eligibility rule. |
| Saved content and collaboration | `src/app/actions.ts`, `src/lib/data.ts`, and Supabase migrations implement saves, vaults, invitations and access rules. Private content is not a public gallery or end-to-end encrypted. This is not a fresh production RLS audit. |
| Previews | `src/lib/metadata.ts` requests public preview data; remote images can generate browser/provider requests. URLs can contain confidential data. |
| AI | `src/lib/categorize.ts` sends URL, title, up to 600 description characters, source and existing vault names to Gemini when the operator configures it. No separate notes field or uploaded image bytes are sent by this integration. No individual opt-out setting or general consent dashboard exists. |
| Storage | `src/lib/r2.ts` and `src/lib/data.ts` support private R2 and legacy Supabase files through signed links. Configuration controls availability; this review does not establish which integrations are active in production. |
| Item deletion | `src/app/actions.ts` removes an active item; object cleanup is a separate operation and can fail or be queued. `scripts/cleanup-r2.mjs` supports operator cleanup; its existence does not prove it runs on a schedule. |
| Local data and extension | `public/sw.js` caches visited content and handles sign-out cache-clear requests. `extensions/chrome/service-worker.mjs` opens the chosen URL after a user action; the extension save flow requires Save. Cache clearing is not remote revocation of downloaded copies. |
| Open source | The public repository includes `LICENSE` (MIT), contribution instructions and third-party notices. MIT permits commercial reuse subject to its notice requirements. Hosted user data, credentials, endorsement and rights in third-party content are not provided by publishing code. |

## Operator obligations, not automated features

The published policies commit MaestroTG to receiving and responding to requests, verifying identity proportionately, manually arranging account deletion/data copies, assessing objections and incidents, and providing legally required notices. There is no automated email-to-deletion pipeline, account export UI, breach-notification workflow or policy-update notification workflow in this app. These commitments require a monitored inbox and an actual operational process.

Do not interpret the existence of policy text as evidence that those processes have already been performed. The operator must fulfil the commitments and applicable law; documentation alone does not do that.

## Deployment facts still requiring verification

- Actual production integrations, hosting region, subprocessors, log settings and backup retention.
- Provider agreements and applicable international-transfer arrangements.
- Tested deletion of auth records, associated database rows and stored objects, including shared-content ownership, backups and restoration handling.
- Security incident contacts, request-handling procedures and lawful retention exceptions.

The source-backed descriptions have been corrected to avoid claiming an implemented AI toggle, verified user ages, immediate universal deletion, fixed backup-purge schedule or a compliance certification. A Nigerian data-protection professional should assess the operational arrangements and final legal enforceability before representing the service as compliant.
