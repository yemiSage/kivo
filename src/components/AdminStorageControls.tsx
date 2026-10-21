"use client";

import { useState, useTransition } from "react";
import { savePlatformStorage, saveUserStorage } from "@/app/admin/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { LoadingSpinner } from "./LoadingSpinner";
import { cn } from "@/lib/utils";

function Switch({ name, checked, onChange, label }: { name: string; checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50", checked ? "bg-primary" : "bg-input")}
    >
      {checked && <input type="hidden" name={name} value="on" />}
      <span className={cn("inline-block size-5 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-[22px]" : "translate-x-0.5")} />
    </button>
  );
}

function StatusMessage({ message }: { message: { ok: boolean; text: string } | null }) {
  if (!message) return null;
  return <p role="status" className={cn("text-sm", message.ok ? "text-success" : "text-destructive")}>{message.text}</p>;
}

export function PlatformStorageControls({ enabled, userQuotaMb, totalQuotaGb }: { enabled: boolean; userQuotaMb: number; totalQuotaGb: number }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploads, setUploads] = useState(enabled);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setMessage(null);
        start(async () => {
          try {
            const result = await savePlatformStorage({ enabled: form.has("enabled"), userQuotaMb: Number(form.get("quota")), totalQuotaGb: Number(form.get("total")) });
            setMessage(result.ok ? { ok: true, text: "Settings saved." } : { ok: false, text: result.error ?? "Could not save settings." });
          } catch {
            setMessage({ ok: false, text: "Could not save settings. Please try again." });
          }
        });
      }}
    >
      <fieldset disabled={pending} className="divide-y">
        <div className="flex items-center justify-between gap-6 py-4 first:pt-0">
          <div>
            <p className="text-sm font-medium">Image uploads</p>
            <p className="text-sm text-muted-foreground">Let users upload images across the platform.</p>
          </div>
          <Switch name="enabled" checked={uploads} onChange={setUploads} label="Allow image uploads" />
        </div>
        <label className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="block text-sm font-medium">Default quota per user</span>
            <span className="block text-sm text-muted-foreground">Applies to users without a custom quota. 1–100 MB.</span>
          </span>
          <span className="relative sm:w-40">
            <Input name="quota" type="number" min={1} max={100} step={1} defaultValue={userQuotaMb} required className="pr-12" />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">MB</span>
          </span>
        </label>
        <label className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="block text-sm font-medium">Total R2 ceiling</span>
            <span className="block text-sm text-muted-foreground">Hard platform limit. Maximum 9 GB.</span>
          </span>
          <span className="relative sm:w-40">
            <Input name="total" type="number" min={1} max={9} step={1} defaultValue={totalQuotaGb} required className="pr-12" />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">GB</span>
          </span>
        </label>
      </fieldset>
      <p className="rounded-xl bg-secondary px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        Originals up to 5 MB are compressed to 1 MB or less. Lowering quotas only blocks new uploads — existing files are never deleted.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <StatusMessage message={message} />
        <Button type="submit" disabled={pending}>{pending && <LoadingSpinner className="size-4" />}Save changes</Button>
      </div>
    </form>
  );
}

export function UserStorageControls({ userId, email, enabled, quotaMb, defaultQuotaMb }: { userId: string; email: string; enabled: boolean; quotaMb: number | null; defaultQuotaMb: number }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploads, setUploads] = useState(enabled);
  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (value) { setMessage(null); setUploads(enabled); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Manage</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Storage access</DialogTitle>
          <DialogDescription className="break-all">{email}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const quota = String(form.get("quota") ?? "").trim();
            setMessage(null);
            start(async () => {
              try {
                const result = await saveUserStorage({ userId, enabled: form.has("enabled"), quotaMb: quota ? Number(quota) : null });
                if (result.ok) setOpen(false);
                else setMessage({ ok: false, text: result.error ?? "Could not save." });
              } catch {
                setMessage({ ok: false, text: "Could not save. Please try again." });
              }
            });
          }}
        >
          <fieldset disabled={pending} className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
              <div>
                <p className="text-sm font-medium">Allow uploads</p>
                <p className="text-xs text-muted-foreground">Turn off to block new images for this user.</p>
              </div>
              <Switch name="enabled" checked={uploads} onChange={setUploads} label="Allow uploads" />
            </div>
            <label className="block space-y-2">
              <span className="text-sm font-medium">Custom quota</span>
              <span className="relative block">
                <Input name="quota" type="number" min={1} max={100} step={1} defaultValue={quotaMb ?? ""} placeholder={`Default (${defaultQuotaMb})`} className="pr-12" />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">MB</span>
              </span>
              <span className="block text-xs text-muted-foreground">Leave empty to use the platform default.</span>
            </label>
          </fieldset>
          <StatusMessage message={message} />
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending && <LoadingSpinner className="size-4" />}Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
