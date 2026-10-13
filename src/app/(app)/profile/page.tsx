import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { SignOutButton } from "@/components/ProfileClient";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { supabase, user } = await requireUser("/profile");
  const [{ count: items }, { count: collections }] = await Promise.all([
    supabase.from("items").select("id", { count: "exact", head: true }),
    supabase.from("collections").select("id", { count: "exact", head: true }),
  ]);

  return (
    <>
      <PageHeader title="Profile" subtitle="Your account and this device." crumbs={[{ label: "Profile" }]} />
      <div className="flex max-w-2xl flex-col gap-4">
        <section className="flex items-center gap-4 rounded-2xl border bg-card p-5">
          <Avatar className="size-12">
            <AvatarFallback className="bg-primary text-base font-medium text-primary-foreground">{(user.email ?? "?")[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{user.email}</p>
            <p className="text-sm text-muted-foreground tabular-nums">
              {items ?? 0} saved · {collections ?? 0} vaults
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border bg-card p-3 md:flex-row md:p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <ShieldIcon size={20} />
          </span>
          <div className="text-sm">
            <h2 className="font-medium">Privacy</h2>
            <p className="mt-0.5 max-w-[60ch] text-muted-foreground">
              Your library is private to your account. Uploads sit in private storage and are shown through short-lived links. For links, Kivo
              only reads the preview details a site publishes. It never downloads restricted media.
            </p>
          </div>
        </section>

        <div>
          <SignOutButton />
        </div>
      </div>
    </>
  );
}
