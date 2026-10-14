"use client";
import { useTransition } from "react";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { LogoutIcon } from "./icons";
import { LoadingSpinner } from "./LoadingSpinner";

export function SignOutButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          // Drop offline caches so the next person on this device can't see this library.
          navigator.serviceWorker?.controller?.postMessage("clear-user-cache");
          await signOut();
        })
      }
    >
      {pending ? <LoadingSpinner className="size-4" label="Signing out" /> : <LogoutIcon size={18} />}
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
