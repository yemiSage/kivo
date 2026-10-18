import sharp from "sharp";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { storageAdmin, putR2Image, deleteR2Image } from "@/lib/r2";
import { MAX_ORIGINAL_IMAGE_BYTES, MAX_STORED_IMAGE_BYTES } from "@/lib/storage-policy";
import { saveUpload } from "@/app/actions";

export const runtime = "nodejs";
export const maxDuration = 30;
const headers = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "Invalid request." }, 403);
  const { user } = await getAuthenticatedUser();
  if (!user) return json({ error: "Your session expired. Please sign in again." }, 401);
  let path: string | undefined;
  try {
    // Bound multipart data even when Content-Length is missing or forged.
    const maxBody = MAX_STORED_IMAGE_BYTES + 65536;
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Choose an image." }, 400);
    const chunks: Uint8Array[] = []; let total = 0;
    while (true) {
      const part = await reader.read(); if (part.done) break;
      total += part.value.byteLength;
      if (total > maxBody) { await reader.cancel(); return json({ error: "The compressed image must be 1 MB or smaller." }, 413); }
      chunks.push(part.value);
    }
    const form = await new Response(Buffer.concat(chunks), { headers: { "Content-Type": request.headers.get("content-type") ?? "" } }).formData();
    const file = form.get("file");
    const originalSize = Number(form.get("originalSize"));
    if (!(file instanceof File) || !file.size || file.size > MAX_STORED_IMAGE_BYTES) return json({ error: "Choose an image of 1 MB or smaller after compression." }, 400);
    if (!Number.isSafeInteger(originalSize) || originalSize < file.size || originalSize > MAX_ORIGINAL_IMAGE_BYTES) return json({ error: "Original images must be 5 MB or smaller." }, 400);
    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(buffer, { limitInputPixels: 40000000, animated: true }).metadata();
    const formats: Record<string, { extension: string; mime: string }> = { jpeg: { extension: "jpg", mime: "image/jpeg" }, png: { extension: "png", mime: "image/png" }, webp: { extension: "webp", mime: "image/webp" }, gif: { extension: "gif", mime: "image/gif" }, avif: { extension: "avif", mime: "image/avif" } };
    const format = formats[meta.format ?? ""];
    if (!format || !meta.width || !meta.height) return json({ error: "Use a JPEG, PNG, WebP, GIF or AVIF image." }, 400);
    await sharp(buffer, { limitInputPixels: 40000000 }).stats();
    const admin = storageAdmin();
    path = `${user.id}/r2/${crypto.randomUUID()}.${format.extension}`;
    const reservation = await admin.from("media_uploads").insert({ path, user_id: user.id, bytes: buffer.length });
    if (reservation.error) {
      path = undefined;
      const message = reservation.error.message;
      if ((message.includes("100 MB storage allowance") || message.includes("Your storage allowance") || message.includes("uploads are currently paused")) || message.includes("Storage is temporarily full")) return json({ error: message }, 409);
      throw reservation.error;
    }
    await putR2Image(path, buffer, format.mime);
    const ready = await admin.from("media_uploads").update({ state: "ready" }).eq("path", path);
    if (ready.error) throw ready.error;
    const text = (key: string) => typeof form.get(key) === "string" ? String(form.get(key)) : null;
    const tags = form.getAll("tag").filter((tag): tag is string => typeof tag === "string").slice(0,20);
    const result = await saveUpload({ storagePath: path, title: text("title"), sourceUrl: text("sourceUrl"), collectionId: text("collectionId"), notes: text("notes"), tags });
    if (!result.ok) throw new Error(result.error);
    return json(result);
  } catch {
    if (path) {
      // An ambiguous DB response must never cause removal of an attached image.
      try {
        const reference = await storageAdmin().from("items").select("id").eq("storage_path", path).limit(1);
        if (!reference.error && !reference.data?.length) await deleteR2Image(path);
      } catch { /* Keep the reservation until orphan cleanup confirms deletion. */ }
    }
    return json({ error: "Couldn't upload this image. Check your connection and try again." }, 500);
  }
}
