"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { getLinkMetadata } from "@/lib/metadata";
import { suggestCategory } from "@/lib/categorize";
import { MEDIA_BUCKET, withImages, listCollections } from "@/lib/data";
import { canonicalize, extractUrl, parseHttpUrl } from "@/lib/url";
import { sendVaultInviteEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { deleteR2Image } from "@/lib/r2";
import { isR2Path } from "@/lib/storage-policy";
import type { ActionResult, Collection, Item, ItemKind, ItemView } from "@/lib/types";
import { ITEM_KINDS } from "@/lib/types";

async function authed() {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return { supabase, user: data.user };
}

function fail(error: unknown, fallback = "Something went wrong. Please try again."): { ok: false; error: string } {
  const msg = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String(error.message) : "";
  console.error("[action]", msg || error);
  return { ok: false, error: msg === "Not signed in" ? "Your session expired. Please sign in again." : fallback };
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const out = new Set<string>();
  for (const t of tags) {
    if (typeof t !== "string") continue;
    const v = t.trim().replace(/^#+/, "").toLowerCase().replace(/\s+/g, "-").slice(0, 32);
    if (v) out.add(v);
    if (out.size >= 20) break;
  }
  return [...out];
}

function cleanText(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

function revalidateLibrary() {
  revalidatePath("/", "layout");
}

export type SaveResult = ActionResult<{ item: ItemView; duplicate: boolean; autoCollection: Collection | null }>;

// ─────────────────────────────── Saving ────────────────────────────────

export async function saveLink(input: {
  url: string;
  title?: string | null;
  collectionId?: string | null;
  tags?: string[];
  notes?: string | null;
}): Promise<SaveResult> {
  try {
    const raw = extractUrl(input.url);
    const parsed = raw && parseHttpUrl(raw);
    if (!parsed) return { ok: false, error: "That doesn't look like a valid link.", code: "invalid_url" };
    const url = parsed.toString();

    const { supabase } = await authed();

    // Fast duplicate check before any network work.
    const quickCanonical = canonicalize(url);
    const { data: existing } = await supabase.from("items").select("*").eq("canonical_url", quickCanonical).maybeSingle();
    if (existing) {
      return { ok: true, data: { item: (await withImages(supabase, [existing as Item]))[0], duplicate: true, autoCollection: null } };
    }

    const [meta, collections] = await Promise.all([getLinkMetadata(url), listCollections(supabase)]);

    let collectionId = input.collectionId ?? null;
    let autoCollection: Collection | null = null;
    const suggestion = await suggestCategory(
      { title: meta.title, description: meta.description, siteName: meta.siteName, url: meta.canonicalUrl, platform: meta.platform },
      collections.map((c) => c.name),
    );
    if (!collectionId && suggestion) {
      autoCollection = collections.find((c) => c.name === suggestion) ?? null;
      collectionId = autoCollection?.id ?? null;
    }

    const row = {
      kind: meta.kind,
      url,
      canonical_url: meta.canonicalUrl,
      title: cleanText(input.title, 500) ?? meta.title,
      description: meta.description,
      thumbnail_url: meta.image,
      site_name: meta.siteName,
      platform: meta.platform,
      author: meta.author,
      collection_id: collectionId,
      tags: normalizeTags(input.tags),
      notes: cleanText(input.notes, 10000),
      suggested_category: suggestion,
      metadata_status: meta.status,
    };

    const { data, error } = await supabase.from("items").insert(row).select("*").single();
    if (error?.code === "23505") {
      const { data: dup } = await supabase.from("items").select("*").eq("canonical_url", meta.canonicalUrl).single();
      return { ok: true, data: { item: (await withImages(supabase, [dup as Item]))[0], duplicate: true, autoCollection: null } };
    }
    if (error) throw error;

    revalidateLibrary();
    return { ok: true, data: { item: (await withImages(supabase, [data as Item]))[0], duplicate: false, autoCollection } };
  } catch (e) {
    return fail(e, "Couldn't save that link. Please try again.");
  }
}

export async function saveUpload(input: {
  storagePath: string;
  title?: string | null;
  sourceUrl?: string | null;
  collectionId?: string | null;
  tags?: string[];
  notes?: string | null;
}): Promise<SaveResult> {
  try {
    const { supabase, user } = await authed();
    if (!input.storagePath.startsWith(`${user.id}/`)) return { ok: false, error: "Invalid upload." };
    const source = input.sourceUrl ? parseHttpUrl(extractUrl(input.sourceUrl) ?? "") : null;

    const { data, error } = await supabase
      .from("items")
      .insert({
        kind: "image" as ItemKind,
        storage_path: input.storagePath,
        url: source?.toString() ?? null,
        title: cleanText(input.title, 500),
        collection_id: input.collectionId ?? null,
        tags: normalizeTags(input.tags),
        notes: cleanText(input.notes, 10000),
        metadata_status: "ok",
        site_name: source ? null : "Upload",
      })
      .select("*")
      .single();
    if (error) throw error;

    revalidateLibrary();
    return { ok: true, data: { item: (await withImages(supabase, [data as Item]))[0], duplicate: false, autoCollection: null } };
  } catch (e) {
    return fail(e, "Couldn't save that image.");
  }
}

// ─────────────────────────────── Editing ───────────────────────────────

export async function updateItem(
  id: string,
  patch: {
    title?: string | null;
    notes?: string | null;
    tags?: string[];
    collectionId?: string | null;
    kind?: ItemKind;
    imagePositionX?: number;
    imagePositionY?: number;
  },
): Promise<ActionResult> {
  try {
    const { supabase } = await authed();
    const update: Record<string, unknown> = {};
    if ("title" in patch) update.title = cleanText(patch.title, 500);
    if ("notes" in patch) update.notes = cleanText(patch.notes, 10000);
    if ("tags" in patch) update.tags = normalizeTags(patch.tags);
    if ("collectionId" in patch) update.collection_id = patch.collectionId || null;
    if (patch.kind && ITEM_KINDS.includes(patch.kind)) update.kind = patch.kind;
    if (Number.isFinite(patch.imagePositionX)) update.image_position_x = Math.round(Math.min(100, Math.max(0, patch.imagePositionX!)));
    if (Number.isFinite(patch.imagePositionY)) update.image_position_y = Math.round(Math.min(100, Math.max(0, patch.imagePositionY!)));

    const { error } = await supabase.from("items").update(update).eq("id", id);
    if (error) throw error;
    revalidateLibrary();
    return { ok: true };
  } catch (e) {
    return fail(e, "Couldn't update this item.");
  }
}

export async function refreshPreview(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await authed();
    const { data: item } = await supabase.from("items").select("url").eq("id", id).single();
    if (!item?.url) return { ok: false, error: "Nothing to refresh." };
    const meta = await getLinkMetadata(item.url);
    const { error } = await supabase
      .from("items")
      .update({
        title: meta.title,
        description: meta.description,
        thumbnail_url: meta.image,
        site_name: meta.siteName,
        author: meta.author,
        metadata_status: meta.status,
      })
      .eq("id", id);
    if (error) throw error;
    revalidateLibrary();
    return { ok: true };
  } catch (e) {
    return fail(e, "Couldn't refresh the preview.");
  }
}

export async function deleteItem(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await authed();
    const { data: item, error } = await supabase.from("items").delete().eq("id", id).select("storage_path").maybeSingle();
    if (error) throw error;
    if (item?.storage_path) {
      if (isR2Path(item.storage_path)) {
        try { await deleteR2Image(item.storage_path); } catch { /* Remains counted and queued for cleanup. */ }
      } else await supabase.storage.from(MEDIA_BUCKET).remove([item.storage_path]);
    }
    revalidateLibrary();
    return { ok: true };
  } catch (e) {
    return fail(e, "Couldn't delete this item.");
  }
}

// ───────────────────────────── Collections ─────────────────────────────

export async function createCollection(name: string, emoji?: string | null): Promise<ActionResult<{ collection: Collection }>> {
  try {
    const clean = name.trim().slice(0, 60);
    if (!clean) return { ok: false, error: "Give your vault a name." };
    const { supabase } = await authed();
    const { data, error } = await supabase
      .from("collections")
      .insert({ name: clean, emoji: cleanText(emoji, 8) })
      .select("*")
      .single();
    if (error?.code === "23505") return { ok: false, error: "You already have a vault with that name." };
    if (error) throw error;
    revalidateLibrary();
    return { ok: true, data: { collection: data as Collection } };
  } catch (e) {
    return fail(e, "Couldn't create the vault.");
  }
}

export async function updateCollection(id: string, name: string, emoji?: string | null): Promise<ActionResult> {
  try {
    const clean = name.trim().slice(0, 60);
    if (!clean) return { ok: false, error: "Name can't be empty." };
    const { supabase } = await authed();
    const { error } = await supabase.from("collections").update({ name: clean, emoji: cleanText(emoji, 8) }).eq("id", id);
    if (error?.code === "23505") return { ok: false, error: "You already have a vault with that name." };
    if (error) throw error;
    revalidateLibrary();
    return { ok: true };
  } catch (e) {
    return fail(e, "Couldn't rename the vault.");
  }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await authed();
    // Items are kept: collection_id is set to null by the FK.
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) throw error;
    revalidateLibrary();
  } catch (e) {
    return fail(e, "Couldn't delete the vault.");
  }
  redirect("/collections");
}

export async function createVaultInvite(vaultId: string): Promise<ActionResult<{ token: string }>> {
  try {
    const { supabase } = await authed();
    const { data, error } = await supabase
      .from("vault_invites")
      .insert({ vault_id: vaultId })
      .select("token")
      .single();
    if (error) throw error;
    return { ok: true, data: { token: data.token } };
  } catch (e) {
    return fail(e, "Couldn't create an invite. Apply the shared-vault database migration first.");
  }
}

export async function sendVaultInvite(vaultId: string, email: string): Promise<ActionResult> {
  try {
    const recipient = email.trim().toLowerCase().slice(0, 320);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) return { ok: false, error: "Enter a valid email address." };
    const { supabase, user } = await authed();
    const { data: vault, error: vaultError } = await supabase.from("collections").select("name").eq("id", vaultId).single();
    if (vaultError || !vault) throw vaultError ?? new Error("Vault not found");

    const { data: invite, error } = await supabase
      .from("vault_invites")
      .insert({ vault_id: vaultId, invited_email: recipient })
      .select("id, token")
      .single();
    if (error) throw error;

    try {
      await sendVaultInviteEmail({
        to: recipient,
        vaultName: vault.name,
        inviter: user.email ?? "Someone",
        inviteUrl: `${env.siteUrl.replace(/\/$/, "")}/vault-invite/${invite.token}`,
      });
    } catch (emailError) {
      await supabase.from("vault_invites").delete().eq("id", invite.id);
      throw emailError;
    }
    return { ok: true };
  } catch (e) {
    return fail(e, "Couldn't send the invitation. Check the Brevo configuration and try again.");
  }
}

export async function acceptVaultInvite(token: string): Promise<ActionResult<{ vaultId: string }>> {
  try {
    const { supabase } = await authed();
    const { data, error } = await supabase.rpc("accept_vault_invite", { invite_token: token });
    if (error) throw error;
    revalidateLibrary();
    return { ok: true, data: { vaultId: data as string } };
  } catch (e) {
    return fail(e, "This invitation is invalid or has expired.");
  }
}

// ─────────────────────────────── Account ───────────────────────────────

export async function signOut() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
