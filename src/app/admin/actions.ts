"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/admin";
import { storageAdmin } from "@/lib/r2";

export async function savePlatformStorage(input: { enabled: boolean; userQuotaMb: number; totalQuotaGb: number }) {
  const actor = await requireSuperAdmin();
  if (typeof input.enabled !== "boolean" || !Number.isInteger(input.userQuotaMb) || input.userQuotaMb < 1 || input.userQuotaMb > 100 || !Number.isInteger(input.totalQuotaGb) || input.totalQuotaGb < 1 || input.totalQuotaGb > 9) return { ok: false, error: "Use a user quota of 1–100 MB and a total ceiling of 1–9 GB." };
  const { error } = await storageAdmin().rpc("admin_save_platform_storage", { p_actor: actor.id, p_enabled: input.enabled, p_user_quota: input.userQuotaMb * 1048576, p_total_quota: input.totalQuotaGb * 1000000000 });
  if (error) return { ok: false, error: "Could not save platform settings. Check that the admin migration is installed." };
  revalidatePath("/admin");
  return { ok: true };
}

export async function saveUserStorage(input: { userId: string; enabled: boolean; quotaMb: number | null }) {
  const actor = await requireSuperAdmin();
  if (!/^[0-9a-f-]{36}$/.test(input.userId) || typeof input.enabled !== "boolean" || (input.quotaMb !== null && (!Number.isInteger(input.quotaMb) || input.quotaMb < 1 || input.quotaMb > 100))) return { ok: false, error: "Use a quota of 1–100 MB, or leave it blank for the platform default." };
  const { error } = await storageAdmin().rpc("admin_save_user_storage", { p_actor: actor.id, p_user: input.userId, p_enabled: input.enabled, p_quota: input.quotaMb === null ? null : input.quotaMb * 1048576 });
  if (error) return { ok: false, error: "Could not update this user's storage controls." };
  revalidatePath("/admin");
  return { ok: true };
}
