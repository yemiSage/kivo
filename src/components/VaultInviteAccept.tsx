"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { acceptVaultInvite } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { FolderIcon } from "@/components/icons";
import { useToast } from "@/components/Toast";

export function VaultInviteAccept({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const toast = useToast();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <span className="mb-4 flex size-12 items-center justify-center rounded-xl bg-secondary"><FolderIcon size={24} /></span>
      <h1 className="text-2xl font-semibold tracking-tight">Join this vault</h1>
      <p className="mt-2 text-sm text-muted-foreground">You’ll be able to save, edit, and remove items alongside everyone else in it.</p>
      <Button
        className="mt-6 w-full"
        disabled={pending}
        onClick={() => start(async () => {
          const res = await acceptVaultInvite(token);
          if (!res.ok) return toast(res.error, "error");
          router.replace(`/collections/${res.data.vaultId}`);
          router.refresh();
        })}
      >
        {pending ? "Joining" : "Join shared vault"}
      </Button>
    </div>
  );
}
