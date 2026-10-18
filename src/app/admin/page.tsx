import type { Metadata } from "next";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

function MetricCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <article className="rounded-2xl border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </article>
  );
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const [{ email }, params] = await Promise.all([requireSuperAdmin(), searchParams]);
  const q = typeof params.q === "string" ? params.q : "";
  const { overview, users } = await getAdminDashboard(q);
  const storagePercent = Math.min(100, (overview.storageBytes / overview.storageQuotaBytes) * 100);

  return (
    <main className="min-h-dvh px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="shadow-float flex flex-col gap-4 rounded-3xl border border-white/70 bg-shell p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandMark size={38} />
            <div>
              <p className="text-lg font-semibold tracking-tight">Kivo Superadmin</p>
              <p className="text-sm text-muted-foreground">Signed in as {email}</p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href="https://kivo-save.vercel.app/" target="_blank" rel="noopener noreferrer">Open Kivo</Link>
          </Button>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total users" value={overview.totalUsers.toLocaleString()} detail={`${overview.newUsers7d.toLocaleString()} joined in the last 7 days`} />
          <MetricCard label="Saved items" value={overview.itemCount.toLocaleString()} detail={`${overview.uploadCount.toLocaleString()} uploaded images`} />
          <MetricCard label="Storage used" value={formatBytes(overview.storageBytes)} detail={`of ${formatBytes(overview.storageQuotaBytes)} configured capacity`} />
          <MetricCard label="Storage remaining" value={formatBytes(Math.max(0, overview.storageQuotaBytes - overview.storageBytes))} detail={`${storagePercent.toFixed(1)}% currently used`} />
        </section>

        <section className="mt-4 rounded-2xl border bg-card p-5" aria-label="Storage usage">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium">Storage capacity</span>
            <span className="text-muted-foreground">{storagePercent.toFixed(1)}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.max(storagePercent, overview.storageBytes ? 0.5 : 0)}%` }} />
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border bg-card">
          <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-semibold">Users</h1>
              <p className="text-sm text-muted-foreground">Showing up to 100 accounts, ordered by storage use.</p>
            </div>
            <form className="flex w-full gap-2 sm:w-auto" action="/admin">
              <Input name="q" defaultValue={q} placeholder="Search email" className="sm:w-64" />
              <Button type="submit" variant="outline">Search</Button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-secondary/70 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Storage</th>
                  <th className="px-4 py-3 font-medium">Uploads</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Collections</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Last sign-in</th>
                  <th className="px-4 py-3 font-medium">Last save</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.userId} className="hover:bg-secondary/40">
                    <td className="px-5 py-4">
                      <p className="font-medium">{user.email}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{user.userId}</p>
                    </td>
                    <td className="px-4 py-4 font-medium">{formatBytes(user.storageBytes)}</td>
                    <td className="px-4 py-4">{user.uploadCount.toLocaleString()}</td>
                    <td className="px-4 py-4">{user.itemCount.toLocaleString()}</td>
                    <td className="px-4 py-4">{user.collectionCount.toLocaleString()}</td>
                    <td className="px-4 py-4 text-muted-foreground">{formatDate(user.joinedAt)}</td>
                    <td className="px-4 py-4 text-muted-foreground">{formatDate(user.lastSignInAt)}</td>
                    <td className="px-4 py-4 text-muted-foreground">{formatDate(user.lastSavedAt)}</td>
                  </tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">No users matched this search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
