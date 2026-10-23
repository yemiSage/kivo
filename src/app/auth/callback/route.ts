import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { loginRecoveryPath } from "@/lib/email-auth";

// PKCE magic-link callback: ?code=…
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const origin = new URL(req.url);
  origin.host = req.headers.get("host") ?? origin.host;
  try {
    if (code) {
      const supabase = await getServerSupabase();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.session) return NextResponse.redirect(new URL(next, origin));
    }
  } catch { /* Recover without exposing provider errors. */ }
  return NextResponse.redirect(new URL(loginRecoveryPath(code ? "browser" : "link", next), origin));
}
