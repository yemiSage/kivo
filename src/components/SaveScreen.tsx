"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { saveLink, saveUpload, updateItem, type SaveResult } from "@/app/actions";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Collection, ItemView, LinkMetadata } from "@/lib/types";
import { extractUrl, hostLabel, parseHttpUrl, PLATFORM_LABEL } from "@/lib/url";
import { CollectionPicker } from "./CollectionPicker";
import { ItemThumb, KIND_META } from "./ItemCard";
import { CheckIcon, ClipboardIcon, ImageIcon, LinkIcon, SparkleIcon, XIcon } from "./icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TagInput } from "./TagInput";
import { useToast } from "./Toast";

const MAX_UPLOAD = 10 * 1024 * 1024;

export interface ShareParams {
  url?: string;
  text?: string;
  title?: string;
  source?: string;
  files?: string;
  files_dropped?: string;
  share_error?: string;
}

type Saved = { item: ItemView; duplicate: boolean; autoCollection: Collection | null };

export function SaveScreen({ collections, share }: { collections: Collection[]; share: ShareParams }) {
  const router = useRouter();
  const toast = useToast();
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<LinkMetadata | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const handledShare = useRef(false);

  const url = extractUrl(input);
  const validUrl = Boolean(url && parseHttpUrl(url));

  // ── Link preview (debounced) ─────────────────────────────────────────
  useEffect(() => {
    if (!validUrl || !url || saved) {
      setPreview(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`, { signal: ctrl.signal });
        if (res.ok) setPreview(await res.json());
      } catch {
        /* preview is best-effort */
      } finally {
        if (!ctrl.signal.aborted) setPreviewLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [url, validUrl, saved]);

  useEffect(() => {
    if (!file) return setFilePreview(null);
    const u = URL.createObjectURL(file);
    setFilePreview(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // ── Save ─────────────────────────────────────────────────────────────
  const handleResult = useCallback(
    (res: SaveResult) => {
      if (!res.ok) {
        setError(res.error);
        toast(res.error, "error");
        return;
      }
      setSaved(res.data);
      setError(null);
      if ("vibrate" in navigator) navigator.vibrate?.(12);
      toast(res.data.duplicate ? "Already in your library" : "Saved");
      router.refresh();
    },
    [router, toast],
  );

  const doSaveLink = useCallback(
    (link: string, opts: { title?: string } = {}) =>
      startSaving(async () => {
        handleResult(await saveLink({ url: link, title: opts.title, collectionId, tags, notes }));
      }),
    [collectionId, tags, notes, handleResult],
  );

  const doSaveFile = useCallback(
    (f: File, sourceUrl?: string | null, title?: string | null) =>
      startSaving(async () => {
        if (f.size > MAX_UPLOAD) {
          setError("Images must be under 10 MB.");
          return;
        }
        const supabase = getBrowserSupabase();
        const { data } = await supabase.auth.getUser();
        if (!data.user) {
          setError("Your session expired. Please sign in again.");
          return;
        }
        const ext = (f.name.split(".").pop() || f.type.split("/")[1] || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
        const path = `${data.user.id}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("media").upload(path, f, { contentType: f.type || undefined, cacheControl: "31536000" });
        if (up.error) {
          setError("Upload failed. Check your connection and try again.");
          return;
        }
        handleResult(await saveUpload({ storagePath: path, sourceUrl, title: title || f.name.replace(/\.[^.]+$/, ""), collectionId, tags, notes }));
      }),
    [collectionId, tags, notes, handleResult],
  );

  const submit = () => {
    setError(null);
    if (file) return doSaveFile(file, url);
    if (url && validUrl) return doSaveLink(url);
    setError("Paste a link or choose an image to save.");
  };

  // ── Incoming share (Android share target, or ?url= deep link) ─────────
  useEffect(() => {
    if (handledShare.current) return;
    handledShare.current = true;

    if (share.share_error) toast("Something went wrong receiving that share. Try pasting the link.", "error");
    if (share.files_dropped) toast("Images couldn't be received this time — open Kivo once, then share again.", "error");

    const sharedUrl = extractUrl(share.url) ?? extractUrl(share.text);
    const filesCount = Number(share.files ?? 0);

    if (filesCount > 0) {
      // Files were stashed by the service worker; pull the first one back out.
      (async () => {
        try {
          const res = await fetch("/__share/0");
          if (!res.ok) throw new Error();
          const blob = await res.blob();
          const name = decodeURIComponent(res.headers.get("X-File-Name") ?? "shared-image");
          const f = new File([blob], name, { type: blob.type });
          setFile(f);
          if (sharedUrl) setInput(sharedUrl);
          doSaveFile(f, sharedUrl, share.title);
        } catch {
          toast("Couldn't read the shared image.", "error");
        }
      })();
    } else if (sharedUrl) {
      setInput(sharedUrl);
      // Zero-tap save: shared content is saved immediately; organise after.
      doSaveLink(sharedUrl, { title: share.title && share.title !== sharedUrl ? share.title : undefined });
    } else if (share.text) {
      setInput(share.text);
    }
    window.history.replaceState(null, "", "/save");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return toast("Your clipboard is empty.", "info");
      setFile(null);
      setInput(text.trim());
      const link = extractUrl(text);
      if (link) doSaveLink(link);
      else toast("No link found on your clipboard.", "info");
    } catch {
      toast("Clipboard access was blocked — long-press the field and paste instead.", "info");
    }
  };

  const reset = () => {
    setSaved(null);
    setInput("");
    setPreview(null);
    setFile(null);
    setTags([]);
    setNotes("");
    setCollectionId(null);
    setError(null);
  };

  if (saved) return <SavedPanel saved={saved} collections={collections} onAnother={reset} />;

  const busy = saving;
  const kindMeta = preview ? KIND_META[preview.kind] : null;


  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col gap-6 rounded-2xl border bg-card p-4 md:p-6"
      >
        {/* Link input */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="link">Link</Label>
          <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background pl-3 pr-1 transition focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15">
            <LinkIcon size={18} className="shrink-0 text-muted-foreground" />
            <input
              id="link"
              type="url"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              placeholder="https://"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
              }}
              onPaste={(e) => {
                // Pasting a link is intent enough: save immediately.
                const link = extractUrl(e.clipboardData.getData("text"));
                if (link && !file && !input) {
                  e.preventDefault();
                  setInput(link);
                  doSaveLink(link);
                }
              }}
              disabled={busy}
              aria-describedby="link-help"
              className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
            />
            {input && !busy && (
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => setInput("")} aria-label="Clear link">
                <XIcon size={16} />
              </Button>
            )}
          </div>
          <p id="link-help" className="text-xs text-muted-foreground">
            Paste a link from Instagram, TikTok, X, Pinterest or any site. It saves as soon as you paste.
          </p>
        </div>

        {/* Quick actions */}
        {!input && !file && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Paste & save", hint: "From clipboard", Icon: ClipboardIcon, onClick: pasteFromClipboard },
              { label: "Upload image", hint: "From this device", Icon: ImageIcon, onClick: () => fileInput.current?.click() },
            ].map(({ label, hint, Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                disabled={busy}
                className="flex items-center gap-3 rounded-xl border bg-background p-3 text-left transition hover:bg-secondary active:scale-[0.99] disabled:opacity-50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <Icon size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{hint}</span>
                </span>
              </button>
            ))}
          </div>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              setFile(f);
              setError(null);
            }
            e.target.value = "";
          }}
        />

        {/* Preview */}
        {file && filePreview && (
          <div className="animate-pop relative overflow-hidden rounded-xl border bg-secondary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={filePreview} alt="Selected image preview" className="max-h-80 w-full object-contain" />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              onClick={() => setFile(null)}
              aria-label="Remove image"
              className="absolute right-2 top-2"
            >
              <XIcon size={16} />
            </Button>
          </div>
        )}

        {!file && validUrl && (previewLoading || preview) && (
          <div className="animate-pop flex gap-3 rounded-xl border bg-background p-2" aria-busy={previewLoading}>
            <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
              {previewLoading && !preview ? (
                <Skeleton className="h-full w-full rounded-none" />
              ) : (
                preview && <ItemThumb item={{ image: preview.image, kind: preview.kind, title: preview.title, url: preview.url }} />
              )}
            </div>
            <div className="min-w-0 flex-1 py-1 pr-1">
              {previewLoading && !preview ? (
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-11/12" />
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ) : (
                preview && (
                  <>
                    <p className="line-clamp-2 text-sm font-medium">{preview.title || hostLabel(preview.url)}</p>
                    {preview.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{preview.description}</p>}
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {kindMeta && <kindMeta.Icon size={13} />}
                      {preview.platform !== "web" ? PLATFORM_LABEL[preview.platform] : preview.siteName || hostLabel(preview.url)}
                      {preview.status !== "ok" && <Badge variant="secondary">Limited preview</Badge>}
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        )}

        {/* Options */}
        {(validUrl || file) && (
          <div className="flex flex-col gap-6">
            <CollectionPicker collections={collections} value={collectionId} onChange={setCollectionId} label="Vault" helper="Optional. Kivo suggests one if you skip this." />
            {showMore ? (
              <>
                <TagInput value={tags} onChange={setTags} />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">Note</Label>
                  <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why you saved this" className="resize-none" />
                </div>
              </>
            ) : (
              <Button type="button" variant="link" onClick={() => setShowMore(true)} className="h-auto self-start p-0">
                Add tags or a note
              </Button>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        {(validUrl || file || busy) && (
          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" /> Saving
              </>
            ) : (
              "Save"
            )}
          </Button>
        )}
      </form>

      <ShareHelp />
    </div>
  );
}

// ───────────────────────────── After saving ─────────────────────────────

function SavedPanel({ saved, collections, onAnother }: { saved: Saved; collections: Collection[]; onAnother: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const [collectionId, setCollectionId] = useState(saved.item.collection_id);
  const [tags, setTags] = useState(saved.item.tags);
  const [, start] = useTransition();
  const { item } = saved;

  const patch = (p: Parameters<typeof updateItem>[1]) =>
    start(async () => {
      const res = await updateItem(item.id, p);
      if (!res.ok) toast(res.error, "error");
      else router.refresh();
    });

  return (
    <div className="animate-rise mx-auto flex max-w-xl flex-col gap-6 rounded-2xl border bg-card p-4 md:p-6">
      <div className="flex items-center gap-3">
        <span className="animate-pop flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <CheckIcon size={22} variant="Bold" />
        </span>
        <div>
          <h2 className="font-semibold">{saved.duplicate ? "Already in your library" : "Saved"}</h2>
          {saved.autoCollection && collectionId === saved.autoCollection.id ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <SparkleIcon size={14} /> Filed in {saved.autoCollection.name}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Organise it below, or leave it as is.</p>
          )}
        </div>
      </div>

      <Link href={`/item/${item.id}`} className="flex gap-3 rounded-xl border bg-background p-2 transition hover:bg-secondary">
        <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-secondary">
          <ItemThumb item={item} />
        </div>
        <div className="min-w-0 flex-1 py-1 pr-1">
          <p className="line-clamp-2 text-sm font-medium">{item.title || hostLabel(item.url) || "Untitled"}</p>
          {item.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.description}</p>}
          {item.metadata_status !== "ok" && item.url && <p className="mt-1 text-xs text-muted-foreground">This site limits previews. The original link is saved.</p>}
        </div>
      </Link>

      <CollectionPicker
        collections={collections}
        value={collectionId}
        onChange={(id) => {
          setCollectionId(id);
          patch({ collectionId: id });
        }}
        label="Vault"
      />
      <TagInput
        value={tags}
        onChange={(t) => {
          setTags(t);
          patch({ tags: t });
        }}
      />

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={onAnother}>
          Save another
        </Button>
        <Button asChild>
          <Link href="/">Done</Link>
        </Button>
      </div>
    </div>
  );
}

function ShareHelp() {
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");
  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) setPlatform("ios");
    else if (/android/i.test(ua)) setPlatform("android");
  }, []);

  const steps =
    platform === "android"
      ? ["Install Kivo from the browser menu.", "In any app, tap Share.", "Pick Kivo. It saves instantly."]
      : platform === "ios"
        ? ["In any app, tap Share, then Copy Link.", "Open Kivo and tap Paste & save.", "iOS doesn't list web apps in the share sheet yet."]
        : ["Copy a link from any site.", "Paste it in the Link field.", "On Android, install Kivo to save from the share menu."];

  return (
    <section className="rounded-2xl border bg-secondary/60 p-4 md:p-5">
      <h2 className="text-sm font-semibold">Saving from other apps</h2>
      <ol className="mt-3 flex flex-col gap-3">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-sm text-muted-foreground">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-background text-xs font-medium text-foreground">{i + 1}</span>
            <span className="pt-0.5">{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
