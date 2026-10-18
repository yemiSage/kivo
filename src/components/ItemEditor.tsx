"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteItem, updateItem } from "@/app/actions";
import type { Collection, ItemKind, ItemView } from "@/lib/types";
import { ITEM_KINDS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CollectionPicker } from "./CollectionPicker";
import { KIND_META } from "./ItemCard";
import { CheckIcon, ShareExportIcon, TrashIcon } from "./icons";
import { LoadingSpinner } from "./LoadingSpinner";
import { TagInput } from "./TagInput";
import { useToast } from "./Toast";

export function ItemEditor({ item, collections }: { item: ItemView; collections: Collection[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [collectionId, setCollectionId] = useState(item.collection_id);
  const [tags, setTags] = useState(item.tags);
  const [title, setTitle] = useState(item.title ?? "");
  const [notes, setNotes] = useState(item.notes ?? "");
  const [kind, setKind] = useState<ItemKind>(item.kind);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveRevision = useRef(0);
  const lastSaved = useRef({ title: item.title ?? "", notes: item.notes ?? "" });
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);

  const patch = (p: Parameters<typeof updateItem>[1], message?: string) => {
    const revision = ++saveRevision.current;
    setSaveState("saving");
    start(async () => {
      const res = await updateItem(item.id, p);
      if (!res.ok) {
        if (revision === saveRevision.current) setSaveState("error");
        return toast(res.error, "error");
      }
      if (revision === saveRevision.current) setSaveState("saved");
      if (message) toast(message);
      // updateItem already revalidates the layout in its action response.
    });
  };

  const saveText = () => {
    if (title === lastSaved.current.title && notes === lastSaved.current.notes) return;
    lastSaved.current = { title, notes };
    patch({ title, notes }, "Changes saved");
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <div className="hidden md:block">
        <CollectionPicker
          collections={collections}
          value={collectionId}
          onChange={(id) => {
            setCollectionId(id);
            patch({ collectionId: id }, id ? "Moved" : "Removed from vault");
          }}
        />
      </div>

      <TagInput
        value={tags}
        inputClassName="text-xs md:text-sm"
        onChange={(t) => {
          setTags(t);
          patch({ tags: t });
        }}
      />

      <div className="grid min-w-0 gap-6 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" autoComplete="off" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveText} maxLength={500} className="text-xs md:text-sm" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="kind">Type</Label>
          <Select
            value={kind}
            onValueChange={(v) => {
              setKind(v as ItemKind);
              patch({ kind: v as ItemKind });
            }}
          >
            <SelectTrigger id="kind" className="w-full text-xs md:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEM_KINDS.map((k) => {
                const { Icon, label } = KIND_META[k];
                return (
                  <SelectItem key={k} value={k}>
                    <Icon size={16} /> {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" autoComplete="off" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveText} placeholder="Add context for later…" />
        <p className="flex min-h-5 items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          {saveState === "saving" && <><LoadingSpinner className="size-3.5" label="Saving changes" /> Saving…</>}
          {saveState === "saved" && <><CheckIcon size={14} className="text-success" /> Saved</>}
          {saveState === "error" && <span className="text-destructive">Couldn’t save. Try editing the field again.</span>}
          {saveState === "idle" && "Changes save when you leave a field."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-5">
        {item.url && canShare && (
          <Button variant="outline" onClick={() => navigator.share({ title: item.title ?? undefined, url: item.url! }).catch(() => {})}>
            <ShareExportIcon size={18} /> Share
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={pending}>
              <TrashIcon size={18} /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this item?</AlertDialogTitle>
              <AlertDialogDescription>It will be removed from your library and vaults. This can’t be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() =>
                  start(async () => {
                    const res = await deleteItem(item.id);
                    if (!res.ok) return toast(res.error, "error");
                    toast("Deleted");
                    router.replace("/");
                  })
                }
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
