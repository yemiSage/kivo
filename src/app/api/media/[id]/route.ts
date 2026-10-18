import { getAuthenticatedUser } from "@/lib/supabase/server";
import { signedR2Image } from "@/lib/r2";
import { isR2Path } from "@/lib/storage-policy";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" };
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return new Response(null, { status: 401, headers });
  const { id } = await params;
  // User-token RLS covers both ownership and shared-vault membership.
  const { data, error } = await supabase.from("items").select("storage_path").eq("id", id).maybeSingle();
  if (error || !data?.storage_path || !isR2Path(data.storage_path)) return new Response(null, { status: 404, headers });
  try { return new Response(null, { status: 302, headers: { ...headers, Location: await signedR2Image(data.storage_path) } }); }
  catch { return new Response(null, { status: 503, headers }); }
}
