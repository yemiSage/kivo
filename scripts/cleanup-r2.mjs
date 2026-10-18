import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
loadEnvConfig(process.cwd());
const names = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"];
if (names.some((name) => !process.env[name])) throw new Error("Missing server storage configuration.");
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const s3 = new S3Client({ region: "auto", endpoint: process.env.R2_ENDPOINT, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
const cutoff = new Date(Date.now() - 3600000).toISOString();
const { data, error } = await db.from("media_uploads").select("path").in("state", ["pending", "ready", "delete_pending"]).lt("created_at", cutoff).order("created_at").limit(100);
if (error) throw new Error("Could not read storage cleanup queue.");
let cleaned = 0; let failed = 0;
for (const row of data ?? []) {
  try {
    const reference = await db.from("items").select("id").eq("storage_path", row.path).limit(1);
    if (reference.error || reference.data?.length) continue;
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: row.path }));
    const removed = await db.from("media_uploads").delete().eq("path", row.path).in("state", ["pending", "ready", "delete_pending"]);
    if (removed.error) throw removed.error;
    cleaned++;
  } catch { failed++; }
}
console.log(JSON.stringify({ checked: data?.length ?? 0, cleaned, failed }));
if (failed) process.exitCode = 1;
