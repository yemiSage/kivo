import { MAX_ORIGINAL_IMAGE_BYTES, MAX_STORED_IMAGE_BYTES } from "./storage-policy";
export const MAX_IMAGE_UPLOAD_BYTES = MAX_ORIGINAL_IMAGE_BYTES;
const MAX_DIMENSION = 1920;

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image encoding failed.")), "image/webp", quality);
  });
}

export async function optimizeImageForUpload(file: File): Promise<File> {
  if (!file.size || file.size > MAX_ORIGINAL_IMAGE_BYTES) throw new Error("Choose an image that is 5 MB or smaller.");
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size <= MAX_STORED_IMAGE_BYTES) return file;
  if (file.type === "image/gif") throw new Error("Animated GIFs must be 1 MB or smaller to preserve their animation.");
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("This image couldn't be compressed. Use JPEG, PNG or WebP, or an image under 1 MB."); }
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image compression is unavailable in this browser.");
    const initialScale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    for (const factor of [1, 0.8, 0.6, 0.4, 0.25]) {
      canvas.width = Math.max(1, Math.round(bitmap.width * initialScale * factor));
      canvas.height = Math.max(1, Math.round(bitmap.height * initialScale * factor));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.82, 0.68, 0.52]) {
        const blob = await canvasBlob(canvas, quality);
        if (blob.size <= MAX_STORED_IMAGE_BYTES) return new File([blob], (file.name.replace(/\.[^.]+$/, "") || "image") + ".webp", { type: blob.type, lastModified: file.lastModified });
      }
    }
    throw new Error("This image couldn't be compressed below 1 MB. Choose a smaller image.");
  } finally { bitmap.close(); }
}
