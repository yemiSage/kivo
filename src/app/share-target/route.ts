import { NextResponse, type NextRequest } from "next/server";

/*
 * Web Share Target endpoint (see public/manifest.webmanifest).
 *
 * Normally the service worker intercepts this POST, stashes any shared files
 * and redirects to /save. This handler is the fallback for when the worker
 * isn't active yet (first launch after install): text and links still get
 * through, files are dropped with a notice.
 */
export async function POST(req: NextRequest) {
  const params = new URLSearchParams();
  try {
    const form = await req.formData();
    for (const key of ["url", "text", "title"] as const) {
      const v = form.get(key);
      if (typeof v === "string" && v) params.set(key, v.slice(0, 4000));
    }
    if (form.getAll("media").some((f) => typeof f !== "string")) params.set("files_dropped", "1");
  } catch {
    params.set("share_error", "1");
  }
  params.set("source", "share");
  return NextResponse.redirect(new URL(`/save?${params}`, req.url), 303);
}

// Some launchers hit the action with GET.
export function GET(req: NextRequest) {
  const params = new URLSearchParams(req.nextUrl.searchParams);
  params.set("source", "share");
  return NextResponse.redirect(new URL(`/save?${params}`, req.url), 303);
}
