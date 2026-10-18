# R2 Standard storage rollout

Kivo uploads new images to a private R2 bucket. Existing Supabase media remains readable and deletable; this change does not migrate or remove those files.

## Limits

- Original images: at most 5 MiB (5,242,880 bytes), checked before browser compression.
- Stored images: at most 1 MiB (1,048,576 bytes), independently enforced by the server and database.
- Files already at/below 1 MiB pass through unchanged, subject to image validation. Supported formats: JPEG, PNG, WebP, GIF and AVIF. Convert HEIC/HEIF to a supported format first.
- Larger supported static images are converted to WebP with progressive quality/dimension reductions until at/below 1 MiB. Failure rejects the upload instead of silently keeping an oversized file. GIFs over 1 MiB are rejected to preserve animation. Browser canvas conversion of other animated formats produces a static image.
- Each user receives 100 MiB (104,857,600 bytes). Existing Supabase objects under their user folder also count. R2 reservations are counted before upload, including unfinished uploads and pending deletion, so concurrent requests cannot exceed the quota.
- The dedicated R2 bucket has a 9,000,000,000-byte application ceiling. Keep this bucket exclusive to Kivo; dashboard uploads and other apps bypass its ledger. This is a storage cap, not a guarantee against operation charges.

## Required server settings

R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and SUPABASE_SERVICE_ROLE_KEY. Never prefix these with NEXT_PUBLIC_. Use Standard storage and keep public bucket access disabled. The server uploads bytes itself, so no browser PUT CORS policy is needed.

## Rollout order

1. Verify the five server settings exist in Vercel Production/Preview. For local real-storage tests, add them to the ignored .env.local file as well. Do not paste keys in chat.
2. In Supabase SQL Editor, run [0009_r2_storage_quotas.sql](../supabase/migrations/0009_r2_storage_quotas.sql). Apply migrations 0001–0008 first if missing. This creates a private ledger and quota triggers and updates admin usage totals. It disables direct new Supabase media inserts; existing items and files are retained. Coordinate this step with deployment: old app versions cannot upload after the migration.
3. Deploy this app revision promptly and refresh older installed PWA sessions. Uploads require the migration and fail closed if it is absent.
4. Verify a small unchanged image, a compressed large image, rejection above 5 MiB, quota exhaustion, deletion, and shared-vault image access against the live project.
5. Schedule the cleanup command below on a trusted server/CI with the same private settings. Apply environment settings to Preview as well, or exclude Preview from real upload testing.

## Failed upload/deletion cleanup

Normal upload failures attempt to remove the R2 object and release its ledger reservation. A reference check prevents deleting an object if the item insert may have succeeded. Deleting an item marks its object for cleanup; quota is released only after R2 confirms deletion. Ambiguous failures remain counted, prioritizing quota safety over temporarily available capacity.

Run npm run storage:cleanup daily (or on demand). It checks at most 100 pending/ready/delete_pending entries older than one hour, confirms no item references them, deletes the object, then releases the ledger entry. Run again to drain larger queues. Do not manually delete ledger rows while the corresponding R2 objects still exist. The script is provided but no hosted schedule is installed by this change.

## Verification boundary

Local PostgreSQL-engine tests exercise the actual migration, legacy quota accounting, attachment uniqueness, owner matching, delete queue, global cap, and denied client ledger writes. Browser checks exercise real canvas compression. Live Cloudflare credentials and hosted database access are required for end-to-end upload verification; local passing tests do not establish that the migration, settings, or deployed bucket are correct.
