"use client";
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

let client: ReturnType<typeof createBrowserClient> | undefined;

export function getBrowserSupabase() {
  // Kivo handles email callbacks explicitly. Automatic URL detection can race
  // that exchange and consume a one-use PKCE code twice.
  client ??= createBrowserClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { detectSessionInUrl: false },
  });
  return client;
}
