export const MAX_ORIGINAL_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_STORED_IMAGE_BYTES = 1024 * 1024;
export const USER_STORAGE_QUOTA_BYTES = 100 * 1024 * 1024;
export function isR2Path(path: string) {
  return /^[0-9a-f-]{36}\/r2\/[0-9a-f-]{36}\.(webp|jpg|png|gif|avif)$/.test(path);
}
