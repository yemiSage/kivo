"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCollection, deleteCollection, updateCollection } from "@/app/actions";
import type { Collection } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditIcon, MoreIcon, PlusIcon, TrashIcon } from "./icons";
import { useToast } from "./Toast";

function NameDialog({
  open,
  onOpenChange,
  title,
  description,
  initial = "",
  submitLabel,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: string;
  initial?: string;
  submitLabel: string;
  pending: boolean;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) setName(initial);
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(name);
          }}
          className="flex flex-col gap-5"
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="collection-name">Name</Label>
            <Input id="collection-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Travel ideas" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Saving" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NewCollectionButton({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon size={18} /> New collection
      </Button>
      <NameDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o && defaultOpen) router.replace("/collections");
        }}
        title="New collection"
        description="Group related saves, like recipes or design references."
        submitLabel="Create"
        pending={pending}
        onSubmit={(name) =>
          start(async () => {
            const res = await createCollection(name);
            if (!res.ok) return toast(res.error, "error");
            setOpen(false);
            toast(`Created ${res.data.collection.name}`);
            router.push(`/collections/${res.data.collection.id}`);
          })
        }
      />
    </>
  );
}

export function CollectionMenu({ collection }: { collection: Collection }) {
  const [mode, setMode] = useState<"none" | "rename" | "delete">("none");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Collection options">
            <MoreIcon size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setMode("rename")}>
            <EditIcon size={16} /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setMode("delete")}>
            <TrashIcon size={16} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NameDialog
        open={mode === "rename"}
        onOpenChange={(o) => setMode(o ? "rename" : "none")}
        title="Rename collection"
        description="Items stay where they are."
        initial={collection.name}
        submitLabel="Save"
        pending={pending}
        onSubmit={(name) =>
          start(async () => {
            const res = await updateCollection(collection.id, name);
            if (!res.ok) return toast(res.error, "error");
            setMode("none");
            router.refresh();
          })
        }
      />

      <AlertDialog open={mode === "delete"} onOpenChange={(o) => setMode(o ? "delete" : "none")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {collection.name}?</AlertDialogTitle>
            <AlertDialogDescription>The collection is removed. Items inside stay in your library.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                start(async () => {
                  const res = await deleteCollection(collection.id);
                  if (res && !res.ok) toast(res.error, "error");
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
