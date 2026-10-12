import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { listCollections } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { SaveScreen, type ShareParams } from "@/components/SaveScreen";

export const metadata: Metadata = { title: "Save" };

const KEYS = ["url", "text", "title", "source", "files", "files_dropped", "share_error"] as const;

export default async function SavePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const share: ShareParams = {};
  for (const k of KEYS) {
    const v = sp[k];
    if (typeof v === "string") share[k] = v.slice(0, 4000);
  }
  const qs = new URLSearchParams(share as Record<string, string>).toString();
  const { supabase } = await requireUser(qs ? `/save?${qs}` : "/save");
  const collections = await listCollections(supabase);

  return (
    <>
      <PageHeader title="Save" subtitle="Paste a link or upload an image." crumbs={[{ label: "Save" }]} />
      <SaveScreen collections={collections} share={share} />
    </>
  );
}
