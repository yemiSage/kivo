"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCollection, createVaultInvite, deleteCollection, updateCollection } from "@/app/actions";
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
import { EditIcon, MoreIcon, PlusIcon, ShareIcon, TrashIcon } from "./icons";
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
        <PlusIcon size={18} /> New vault
      </Button>
      <NameDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o && defaultOpen) router.replace("/collections");
        }}
        title="New vault"
        description="Create a private space now; you can invite people after."
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
  const [mode, setMode] = useState<"none" | "rename" | "share" | "delete">("none");
  const [inviteUrl, setInviteUrl] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Vault options">
            <MoreIcon size={18} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onSelect={() => setMode("rename")}>
            <EditIcon size={16} /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setMode("share")}>
            <ShareIcon size={16} /> Invite people
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setMode("delete")}>
            <TrashIcon size={16} /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NameDialog
        open={mode === "rename"}
        onOpenChange={(o) => setMode(o ? "rename" : "none")}
        title="Rename vault"
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

      <Dialog open={mode === "share"} onOpenChange={(o) => setMode(o ? "share" : "none")}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share {collection.name}</DialogTitle>
            <DialogDescription>Anyone with this link can join for seven days and collaborate on items in this vault.</DialogDescription>
          </DialogHeader>
          {inviteUrl ? (
            <div className="flex gap-2">
              <Input readOnly value={inviteUrl} aria-label="Vault invite link" />
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(inviteUrl);
                  toast("Invite link copied");
                }}
              >
                Copy
              </Button>
            </div>
          ) : (
            <Button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await createVaultInvite(collection.id);
                  if (!res.ok) return toast(res.error, "error");
                  setInviteUrl(`${window.location.origin}/vault-invite/${res.data.token}`);
                })
              }
            >
              <ShareIcon size={18} /> {pending ? "Creating" : "Create invite link"}
            </Button>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={mode === "delete"} onOpenChange={(o) => setMode(o ? "delete" : "none")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {collection.name}?</AlertDialogTitle>
            <AlertDialogDescription>The vault is removed. Items inside stay in your library.</AlertDialogDescription>
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
