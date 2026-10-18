"use client";

import { useState, useTransition } from "react";
import { savePlatformStorage, saveUserStorage } from "@/app/admin/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { LoadingSpinner } from "./LoadingSpinner";

export function PlatformStorageControls({ enabled, userQuotaMb, totalQuotaGb }: { enabled: boolean; userQuotaMb: number; totalQuotaGb: number }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState("");
  return <form className="space-y-5" onSubmit={event => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    start(async () => { try { const result = await savePlatformStorage({ enabled: form.has("enabled"), userQuotaMb: Number(form.get("quota")), totalQuotaGb: Number(form.get("total")) }); setMessage(result.ok ? "Platform settings saved." : result.error ?? "Could not save settings."); } catch { setMessage("Could not save settings. Please try again."); } });
  }}>
    <fieldset disabled={pending} className="grid gap-5 sm:grid-cols-3">
      <label className="flex items-center gap-2 text-sm"><input name="enabled" type="checkbox" defaultChecked={enabled} className="size-4 accent-black" />Allow image uploads</label>
      <label className="space-y-2 text-sm"><span>Default storage per user (MB)</span><Input name="quota" type="number" min={1} max={100} step={1} defaultValue={userQuotaMb} required /></label>
      <label className="space-y-2 text-sm"><span>Total R2 ceiling (GB)</span><Input name="total" type="number" min={1} max={9} step={1} defaultValue={totalQuotaGb} required /></label>
    </fieldset>
    <p className="text-xs text-muted-foreground">Images: 5 MB maximum original, compressed to 1 MB or less. Lower quotas stop new uploads without deleting existing files. The total ceiling stays at or below 9 GB.</p>
    <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={pending}>{pending && <LoadingSpinner className="size-4" />}Save platform settings</Button><p role="status" className="text-sm">{message}</p></div>
  </form>;
}

export function UserStorageControls({ userId, email, enabled, quotaMb, defaultQuotaMb }: { userId: string; email: string; enabled: boolean; quotaMb: number | null; defaultQuotaMb: number }) {
  const [pending, start] = useTransition(); const [message, setMessage] = useState("");
  return <details className="min-w-56"><summary className="cursor-pointer text-sm font-medium">Manage storage</summary><form className="mt-3 space-y-3" onSubmit={event=>{
    event.preventDefault(); const form = new FormData(event.currentTarget); const quota = String(form.get("quota") ?? "").trim();
    start(async()=>{ try { const result = await saveUserStorage({ userId, enabled: form.has("enabled"), quotaMb: quota ? Number(quota) : null }); setMessage(result.ok ? "User storage settings saved." : result.error ?? "Could not save."); } catch { setMessage("Could not save. Please try again."); } });
  }}>
    <fieldset disabled={pending} className="space-y-3">
      <label className="flex items-center gap-2 text-xs"><input name="enabled" type="checkbox" defaultChecked={enabled} className="size-4 accent-black" />Allow uploads</label>
      <label className="block space-y-1 text-xs"><span>Storage quota (MB)</span><Input name="quota" aria-label={`Storage quota for ${email}`} type="number" min={1} max={100} step={1} defaultValue={quotaMb ?? ""} placeholder={`Default: ${defaultQuotaMb} MB`} /></label>
      <Button type="submit" size="sm">{pending ? "Saving…" : "Save user"}</Button>
    </fieldset><p role="status" className="text-xs">{message}</p>
  </form></details>;
}
