import type { Metadata } from "next";
import type { ComponentType } from "react";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformStorageControls, UserStorageControls } from "@/components/AdminStorageControls";
import { BookmarkIcon, ExternalIcon, ImageIcon, SearchIcon, SettingsIcon, ShieldIcon, UserIcon, type IconProps } from "@/components/icons";
import { getAdminDashboard, requireSuperAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Superadmin" };

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes;
  let unit = -1;
  do {
    value /= 1024;
    unit += 1;
  } while (value >= 1024 && unit < units.length - 1);
  return `${value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[unit]}`;
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

function timeAgo(value: string | null) {
  if (!value) return "Never";
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [[60, "second"], [60, "minute"], [24, "hour"], [7, "day"], [4.345, "week"], [12, "month"], [Infinity, "year"]];
  let amount = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(amount) < size) return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-Math.round(amount), unit);
    amount /= size;
  }
  return formatDate(value);
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail?: string; icon: ComponentType<IconProps> }) {
  return (
    <article className="animate-rise rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="grid size-9 place-items-center rounded-xl bg-secondary text-foreground"><Icon size={18} /></span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </article>
  );
}

function Section({ id, title, description, action, children, className }: { id: string; title: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={`rounded-2xl border bg-card ${className ?? ""}`}>
      <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id={id} className="text-base font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const [{ email }, params] = await Promise.all([requireSuperAdmin(), searchParams]);
  const q = typeof params.q === "string" ? params.q : "";
  const { overview, users, settings, userControls, controlsReady, audit, r2Bytes } = await getAdminDashboard(q);
  const r2Capacity = settings.totalQuotaGb * 1000000000;
  const storagePercent = Math.min(100, (r2Bytes / r2Capacity) * 100);
  const meterTone = storagePercent >= 90 ? "bg-destructive" : storagePercent >= 75 ? "bg-amber-500" : "bg-primary";
  const emailFor = (id: string) => users.find((user) => user.userId === id)?.email ?? id;
  const controlFor = (id: string) => userControls.find((control) => control.user_id === id);

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-30 border-b bg-shell/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark size={32} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight">Kivo Admin</h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary-foreground"><ShieldIcon size={11} />Superadmin</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="https://kivo-save.vercel.app/" target="_blank" rel="noopener noreferrer"><ExternalIcon size={16} /><span className="hidden sm:inline">Open Kivo</span></Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Overview</h2>
          <p className="text-sm text-muted-foreground">Platform health, users and storage at a glance.</p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key metrics">
          <MetricCard icon={UserIcon} label="Total users" value={overview.totalUsers.toLocaleString()} detail={`+${overview.newUsers7d.toLocaleString()} in the last 7 days`} />
          <MetricCard icon={BookmarkIcon} label="Saved items" value={overview.itemCount.toLocaleString()} detail={`${overview.uploadCount.toLocaleString()} uploaded images`} />
          <MetricCard icon={ImageIcon} label="Media storage" value={formatBytes(overview.storageBytes)} detail="Supabase and R2 combined" />
          <MetricCard icon={SettingsIcon} label="R2 remaining" value={controlsReady ? formatBytes(Math.max(0, r2Capacity - r2Bytes)) : "—"} detail={controlsReady ? `of ${settings.totalQuotaGb} GB ceiling` : "Storage controls need setup"} />
        </section>

        <section className="rounded-2xl border bg-card p-5" aria-label="R2 capacity">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-medium">R2 capacity</p>
              <p className="text-xs text-muted-foreground">{formatBytes(r2Bytes)} used of {settings.totalQuotaGb} GB</p>
            </div>
            <p className="text-2xl font-semibold tabular-nums">{storagePercent.toFixed(1)}%</p>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={Math.round(storagePercent)} aria-valuemin={0} aria-valuemax={100}>
            <div className={`h-full rounded-full transition-[width] duration-700 ${meterTone}`} style={{ width: `${Math.max(storagePercent, r2Bytes ? 0.5 : 0)}%` }} />
          </div>
        </section>

        <Section
          id="users"
          title="Users"
          description={`${users.length.toLocaleString()} shown · sorted by storage use`}
          action={
            <form className="relative w-full sm:w-72" action="/admin" role="search">
              <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input name="q" type="search" defaultValue={q} placeholder="Search by email…" aria-label="Search users by email" className="pl-9" />
            </form>
          }
        >
          {users.length ? (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-5 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Storage</th>
                      <th className="px-4 py-3 text-right font-medium">Items</th>
                      <th className="px-4 py-3 text-right font-medium">Uploads</th>
                      <th className="px-4 py-3 text-right font-medium">Collections</th>
                      <th className="px-4 py-3 font-medium">Last active</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-5 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => {
                      const control = controlFor(user.userId);
                      const enabled = control?.uploads_enabled ?? true;
                      const quotaMb = control?.quota_bytes == null ? null : Number(control.quota_bytes) / 1048576;
                      const limit = (quotaMb ?? settings.userQuotaMb) * 1048576;
                      const pct = Math.min(100, (user.storageBytes / limit) * 100);
                      return (
                        <tr key={user.userId} className="transition-colors hover:bg-secondary/50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">{initials(user.email)}</span>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{user.email}</p>
                                <p className="text-xs text-muted-foreground">Joined {formatDate(user.joinedAt)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium tabular-nums">{formatBytes(user.storageBytes)}</p>
                            <div className="mt-1.5 h-1 w-24 overflow-hidden rounded-full bg-secondary" title={`${pct.toFixed(0)}% of ${quotaMb ?? settings.userQuotaMb} MB`}>
                              <div className={`h-full rounded-full ${pct >= 90 ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">{user.itemCount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{user.uploadCount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{user.collectionCount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground" title={`Last sign-in: ${formatDate(user.lastSignInAt)} · Last save: ${formatDate(user.lastSavedAt)}`}>{timeAgo(user.lastSavedAt ?? user.lastSignInAt)}</td>
                          <td className="px-4 py-3"><StatusPill enabled={enabled} custom={quotaMb != null} /></td>
                          <td className="px-5 py-3 text-right">
                            {controlsReady ? <UserStorageControls userId={user.userId} email={user.email} enabled={enabled} quotaMb={quotaMb} defaultQuotaMb={settings.userQuotaMb} /> : <span className="text-xs text-muted-foreground">Setup required</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="divide-y lg:hidden">
                {users.map((user) => {
                  const control = controlFor(user.userId);
                  const enabled = control?.uploads_enabled ?? true;
                  const quotaMb = control?.quota_bytes == null ? null : Number(control.quota_bytes) / 1048576;
                  return (
                    <li key={user.userId} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-semibold">{initials(user.email)}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{user.email}</p>
                            <p className="text-xs text-muted-foreground">Active {timeAgo(user.lastSavedAt ?? user.lastSignInAt)}</p>
                          </div>
                        </div>
                        {controlsReady && <UserStorageControls userId={user.userId} email={user.email} enabled={enabled} quotaMb={quotaMb} defaultQuotaMb={settings.userQuotaMb} />}
                      </div>
                      <dl className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-secondary/60 p-3 text-center">
                        <MiniStat label="Storage" value={formatBytes(user.storageBytes)} />
                        <MiniStat label="Items" value={user.itemCount.toLocaleString()} />
                        <MiniStat label="Uploads" value={user.uploadCount.toLocaleString()} />
                        <MiniStat label="Collections" value={user.collectionCount.toLocaleString()} />
                      </dl>
                      <div className="mt-3"><StatusPill enabled={enabled} custom={quotaMb != null} /></div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-secondary"><SearchIcon size={20} /></span>
              <p className="font-medium">No users found</p>
              <p className="text-sm text-muted-foreground">{q ? <>Nothing matched “{q}”. <Link href="/admin" className="underline underline-offset-4">Clear search</Link></> : "No accounts yet."}</p>
            </div>
          )}
        </Section>

        <div className="grid gap-6 lg:grid-cols-5">
          <Section id="platform-settings" title="Platform settings" description="Changes apply to new uploads only." className="lg:col-span-3">
            <div className="p-5">
              {controlsReady ? <PlatformStorageControls key={JSON.stringify(settings)} enabled={settings.enabled} userQuotaMb={settings.userQuotaMb} totalQuotaGb={settings.totalQuotaGb} /> : <p className="text-sm text-muted-foreground">Apply the admin storage controls migration to enable management settings.</p>}
            </div>
          </Section>

          <Section id="admin-activity" title="Recent activity" description="Latest admin changes" className="lg:col-span-2">
            {audit.length ? (
              <ol className="relative space-y-5 p-5 before:absolute before:bottom-7 before:left-[27px] before:top-7 before:w-px before:bg-border">
                {audit.map((entry) => (
                  <li key={entry.id} className="relative flex gap-3">
                    <span className="relative z-10 mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border bg-card"><span className="size-1.5 rounded-full bg-foreground" /></span>
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">{entry.action === "platform_storage" ? "Platform settings updated" : "User storage updated"}</p>
                      <p className="break-all text-xs text-muted-foreground">{entry.target_user_id ? emailFor(entry.target_user_id) : "All users"}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground" title={new Date(entry.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}>{timeAgo(entry.created_at)} · by {emailFor(entry.actor_id)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">No recorded changes yet.</p>
            )}
          </Section>
        </div>
      </main>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="truncate text-sm font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function StatusPill({ enabled, custom }: { enabled: boolean; custom: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${enabled ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
        <span className={`size-1.5 rounded-full ${enabled ? "bg-success" : "bg-destructive"}`} />
        {enabled ? "Active" : "Uploads off"}
      </span>
      {custom && <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">Custom quota</span>}
    </span>
  );
}
