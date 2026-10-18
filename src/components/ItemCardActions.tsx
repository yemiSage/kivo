"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteItem } from "@/app/actions";
import { Button } from "./ui/button";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "./ui/alert-dialog";
import { EditIcon, TrashIcon } from "./icons";
import { LoadingSpinner } from "./LoadingSpinner";
import { useToast } from "./Toast";

export function ItemCardActions({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <div className="flex shrink-0 justify-end gap-1">
      <Button asChild variant="ghost" size="icon-sm">
        <Link href={`/item/${id}#title`} prefetch={false} aria-label={`Edit ${title}`}><EditIcon size={16} /></Link>
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${title}`} className="text-destructive hover:text-destructive"><TrashIcon size={16} /></Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>“{title}” will be removed from your library and vaults. This can’t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={pending} className="bg-destructive text-white hover:bg-destructive/90" onClick={(event) => {
              event.preventDefault();
              start(async () => {
                const result = await deleteItem(id);
                if (!result.ok) { toast(result.error, "error"); return; }
                setOpen(false);
                toast("Deleted");
              });
            }}>
              {pending && <LoadingSpinner className="size-4" label="Deleting item" />} {pending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
