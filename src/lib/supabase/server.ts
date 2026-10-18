import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { cache } from "react";
import { env } from "@/lib/env";
import { getVerifiedIdentity } from "@/lib/verified-identity";

export const getServerSupabase = cache(async () => {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
});

/** Request-scoped verified identity shared by the layout and page. */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await getServerSupabase();
  const user = await getVerifiedIdentity(supabase);
  return { supabase, user };
});

/** Redirect destinations must not become separate keys for the auth lookup. */
export async function requireUser(next?: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return { supabase, user };
}
