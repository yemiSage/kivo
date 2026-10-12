import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: { accessToken?: string; refreshToken?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  if (!body.accessToken || !body.refreshToken) {
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
