"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteItem, refreshPreview, updateItem } from "@/app/actions";
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
import { RefreshIcon, ShareIcon, TrashIcon } from "./icons";
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
  const lastSaved = useRef({ title: item.title ?? "", notes: item.notes ?? "" });
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);

  const patch = (p: Parameters<typeof updateItem>[1], message?: string) =>
    start(async () => {
      const res = await updateItem(item.id, p);
      if (!res.ok) return toast(res.error, "error");
      if (message) toast(message);
      router.refresh();
    });

  const saveText = () => {
    if (title === lastSaved.current.title && notes === lastSaved.current.notes) return;
    lastSaved.current = { title, notes };
    patch({ title, notes }, "Changes saved");
  };

  return (
    <div className="flex flex-col gap-6">
      <CollectionPicker
        collections={collections}
        value={collectionId}
        onChange={(id) => {
          setCollectionId(id);
          patch({ collectionId: id }, id ? "Moved" : "Removed from collection");
        }}
      />

      <TagInput
        value={tags}
        onChange={(t) => {
          setTags(t);
          patch({ tags: t });
        }}
      />

      <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveText} maxLength={500} />
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
            <SelectTrigger id="kind" className="w-full">
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
        <Textarea id="notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveText} placeholder="Add context for later" />
        <p className="text-xs text-muted-foreground">Saves when you click away.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-t pt-5">
        {item.url && canShare && (
          <Button variant="outline" onClick={() => navigator.share({ title: item.title ?? undefined, url: item.url! }).catch(() => {})}>
            <ShareIcon size={18} /> Share
          </Button>
        )}
        {item.url && (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await refreshPreview(item.id);
                toast(res.ok ? "Preview refreshed" : res.error, res.ok ? "success" : "error");
                if (res.ok) router.refresh();
              })
            }
          >
            <RefreshIcon size={18} /> Refresh preview
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={pending} className="ml-auto">
              <TrashIcon size={18} /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this item?</AlertDialogTitle>
              <AlertDialogDescription>It will be removed from your library and collections. This can’t be undone.</AlertDialogDescription>
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
