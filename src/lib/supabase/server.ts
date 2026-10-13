import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { cache } from "react";
import { env } from "@/lib/env";

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

/** Returns the signed-in user and a client, or redirects to /login. */
export const requireUser = cache(async (next?: string) => {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
  return { supabase, user: data.user };
});
