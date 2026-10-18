import "server-only";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

let client: S3Client | undefined;
function config() {
  const { R2_ENDPOINT: endpoint, R2_ACCESS_KEY_ID: accessKeyId, R2_SECRET_ACCESS_KEY: secretAccessKey, R2_BUCKET_NAME: bucket } = process.env;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) throw new Error("Image storage is not configured yet.");
  client ??= new S3Client({ region: "auto", endpoint, credentials: { accessKeyId, secretAccessKey }, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" });
  return { client, bucket };
}
export function storageAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Image storage is not configured yet.");
  return createClient(env.supabaseUrl, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function putR2Image(path: string, body: Uint8Array, contentType: string) {
  const { client, bucket } = config();
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: path, Body: body, ContentType: contentType, CacheControl: "private, max-age=300" }));
}
export async function deleteR2Image(path: string) {
  const { client, bucket } = config();
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: path }));
  // Only release quota after object deletion is acknowledged. Failure stays counted.
  const { error } = await storageAdmin().from("media_uploads").delete().eq("path", path);
  if (error) throw error;
}
export async function signedR2Image(path: string) {
  const { client, bucket } = config();
  return getSignedUrl(client, new GetObjectCommand({ Bucket: bucket, Key: path }), { expiresIn: 300 });
}
