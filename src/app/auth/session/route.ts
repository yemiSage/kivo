import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if ((origin && origin !== requestUrl.origin) || fetchSite === "cross-site") {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > 20_000) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: { accessToken?: string; refreshToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (
    typeof body.accessToken !== "string" ||
    typeof body.refreshToken !== "string" ||
    !body.accessToken ||
    !body.refreshToken ||
    body.accessToken.length > 8_192 ||
    body.refreshToken.length > 8_192
  ) {
    return NextResponse.json({ error: "missing_tokens" }, { status: 400 });
  }

  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.setSession({
    access_token: body.accessToken,
    refresh_token: body.refreshToken,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: "invalid_session" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
