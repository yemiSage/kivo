export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

const MAX_IMAGE_DIMENSION = 1920;
const REENCODE_THRESHOLD_BYTES = 1024 * 1024;
const OUTPUT_TYPE = "image/webp";

function outputName(name: string) {
  const base = name.replace(/\.[^.]+$/, "") || "image";
  return `${base}.webp`;
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Image encoding failed."))), OUTPUT_TYPE, quality);
  });
}

/** Resize large browser-decodable images and encode them efficiently before upload. */
export async function optimizeImageForUpload(file: File): Promise<File> {
  // Re-encoding an animated GIF would discard its animation.
  if (file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= REENCODE_THRESHOLD_BYTES) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image resizing is unavailable in this browser.");

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    let blob = await canvasBlob(canvas, 0.82);
    if (blob.size > MAX_IMAGE_UPLOAD_BYTES) blob = await canvasBlob(canvas, 0.68);

    // Avoid making an already-small image larger just to change its format.
    if (blob.size >= file.size && file.size <= MAX_IMAGE_UPLOAD_BYTES) return file;
    return new File([blob], outputName(file.name), { type: blob.type, lastModified: file.lastModified });
  } finally {
    bitmap.close();
  }
}
