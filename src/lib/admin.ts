import "server-only";

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { cache } from "react";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/supabase/server";

export interface AdminUserMetric {
  userId: string;
  email: string;
  joinedAt: string;
  lastSignInAt: string | null;
  itemCount: number;
  uploadCount: number;
  collectionCount: number;
  storageBytes: number;
  lastSavedAt: string | null;
}

export interface AdminOverview {
  totalUsers: number;
  newUsers7d: number;
  itemCount: number;
  uploadCount: number;
  storageBytes: number;
  storageQuotaBytes: number;
}

type OverviewRow = {
  total_users: number | string;
  new_users_7d: number | string;
  item_count: number | string;
  upload_count: number | string;
  storage_bytes: number | string;
};

type UserMetricRow = {
  user_id: string;
  email: string | null;
  joined_at: string;
  last_sign_in_at: string | null;
  item_count: number | string;
  upload_count: number | string;
  collection_count: number | string;
  storage_bytes: number | string;
  last_saved_at: string | null;
};

function number(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function adminEmails() {
  return new Set(
    (process.env.SUPERADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const requireSuperAdmin = cache(async () => {
  const { user } = await requireUser("/admin");
  const email = user.email?.toLowerCase();
  if (!email || !adminEmails().has(email)) notFound();
  return { id: user.id, email };
});

function getAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
  return createClient(env.supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function getAdminDashboard(search = "") {
  await requireSuperAdmin();
  const admin = getAdminClient();
  const cleanSearch = search.trim().slice(0, 200);

  const [overviewResult, usersResult] = await Promise.all([
    admin.rpc("superadmin_overview"),
    admin.rpc("superadmin_user_metrics", { search_term: cleanSearch || null, result_limit: 100, result_offset: 0 }),
  ]);

  if (overviewResult.error) throw overviewResult.error;
  if (usersResult.error) throw usersResult.error;

  const overviewRow = (overviewResult.data?.[0] ?? {}) as Partial<OverviewRow>;
  const quotaGb = Math.max(0.001, number(process.env.SUPABASE_STORAGE_QUOTA_GB || 1));
  const overview: AdminOverview = {
    totalUsers: number(overviewRow.total_users),
    newUsers7d: number(overviewRow.new_users_7d),
    itemCount: number(overviewRow.item_count),
    uploadCount: number(overviewRow.upload_count),
    storageBytes: number(overviewRow.storage_bytes),
    storageQuotaBytes: quotaGb * 1024 * 1024 * 1024,
  };

  const users: AdminUserMetric[] = ((usersResult.data ?? []) as UserMetricRow[]).map((row) => ({
    userId: row.user_id,
    email: row.email ?? "No email",
    joinedAt: row.joined_at,
    lastSignInAt: row.last_sign_in_at,
    itemCount: number(row.item_count),
    uploadCount: number(row.upload_count),
    collectionCount: number(row.collection_count),
    storageBytes: number(row.storage_bytes),
    lastSavedAt: row.last_saved_at,
  }));

  return { overview, users, search: cleanSearch };
}
