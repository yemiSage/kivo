import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";
import { emailOtpType, loginRecoveryPath } from "@/lib/email-auth";

function requestOrigin(req: NextRequest) {
  const url = new URL(req.url);
  url.host = req.headers.get("host") ?? url.host;
  return url.origin;
}

function redirect(req: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, requestOrigin(req)), 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

// A scanner may GET an email link. Do not consume its one-use token until the
// person explicitly submits the confirmation form (also works across browsers).
export async function GET(req: NextRequest) {
  const tokenHash = req.nextUrl.searchParams.get("token_hash");
  const type = emailOtpType(req.nextUrl.searchParams.get("type") ?? "email");
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  if (!tokenHash || tokenHash.length > 512 || !type) return redirect(req, loginRecoveryPath("link", next));
  return redirect(req, `/auth/verify?${new URLSearchParams({ token_hash: tokenHash, type, next })}`);
}

export async function POST(req: NextRequest) {
  // Prevent another origin from logging a visitor into an attacker's account.
  // Next may normalize req.url to its listening hostname. The Host header is
  // the browser's actual destination, including the production/custom domain.
  if (req.headers.get("origin") !== requestOrigin(req)) {
    return new NextResponse("Invalid request origin.", { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  let next = "/";
  try {
    const form = await req.formData();
    next = safeNext(typeof form.get("next") === "string" ? form.get("next") as string : null);
    const tokenHash = form.get("token_hash");
    const type = emailOtpType(form.get("type"));
    if (typeof tokenHash !== "string" || !tokenHash || tokenHash.length > 512 || !type) return redirect(req, loginRecoveryPath("link", next));
    const supabase = await getServerSupabase();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error && data.session) return redirect(req, next);
  } catch { /* Do not expose tokens or provider errors in responses or logs. */ }
  return redirect(req, loginRecoveryPath("link", next));
}
