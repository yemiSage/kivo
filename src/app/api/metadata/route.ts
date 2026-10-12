import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { getLinkMetadata } from "@/lib/metadata";
import { extractUrl, parseHttpUrl } from "@/lib/url";

// Signed-in only, so this can't be used as an open proxy.
export async function GET(req: NextRequest) {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const raw = extractUrl(req.nextUrl.searchParams.get("url"));
  const url = raw && parseHttpUrl(raw);
  if (!url) return NextResponse.json({ error: "invalid_url" }, { status: 400 });

  const meta = await getLinkMetadata(url.toString());
  return NextResponse.json(meta, { headers: { "Cache-Control": "private, max-age=600" } });
}
