import "server-only";

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { cache } from "react";
import { env } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=%2Fadmin");
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

  const [overviewResult, usersResult, settingsResult, auditResult, r2Result] = await Promise.all([
    admin.rpc("superadmin_overview"),
    admin.rpc("superadmin_user_metrics", { search_term: cleanSearch || null, result_limit: 100, result_offset: 0 }),
    admin.from("platform_storage_settings").select("*").eq("id",1).maybeSingle(),
    admin.from("admin_storage_audit").select("id, actor_id, target_user_id, action, created_at").order("id", { ascending: false }).limit(10),
    admin.rpc("r2_storage_usage"),
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

  const controlsResult = users.length ? await admin.from("user_storage_controls").select("user_id,quota_bytes,uploads_enabled").in("user_id", users.map(user => user.userId)) : { data: [], error: null };
  return { overview, users, search: cleanSearch,
    controlsReady: !settingsResult.error && Boolean(settingsResult.data) && !controlsResult.error && !auditResult.error && !r2Result.error,
    settings: { enabled: settingsResult.data?.uploads_enabled ?? true, userQuotaMb: number(settingsResult.data?.default_user_quota_bytes ?? 104857600) / 1048576, totalQuotaGb: number(settingsResult.data?.total_quota_bytes ?? 9000000000) / 1000000000 },
    userControls: (controlsResult.data ?? []) as { user_id: string; quota_bytes: number | null; uploads_enabled: boolean }[],
    audit: (auditResult.data ?? []) as { id: number; actor_id: string; target_user_id: string | null; action: string; created_at: string }[],
    r2Bytes: number(r2Result.data),
  };
}
