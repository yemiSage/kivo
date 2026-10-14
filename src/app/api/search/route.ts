import { NextResponse, type NextRequest } from "next/server";
import { searchItems } from "@/lib/data";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 200) ?? "";
  if (!query) return NextResponse.json({ items: [] }, { headers: { "Cache-Control": "no-store" } });

  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const items = await searchItems(supabase, query, null, null, 24);
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
