"use client";
import { useEffect, useState, useTransition } from "react";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutIcon, MobileIcon } from "./icons";
import { isIOS, isStandalone } from "./PwaClient";

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
      <LogoutIcon size={18} />
      {pending ? "Signing out" : "Sign out"}
    </Button>
  );
}

export function DeviceInfo() {
  const [info, setInfo] = useState<{ installed: boolean; ios: boolean; android: boolean } | null>(null);
  useEffect(() => {
    setInfo({ installed: isStandalone(), ios: isIOS(), android: /android/i.test(navigator.userAgent) });
  }, []);
  if (!info) return <Skeleton className="h-28 rounded-2xl" />;

  const shareSupport = info.android
    ? info.installed
      ? "Kivo is in your share menu. Share from any app to save instantly."
      : "Install Kivo from your browser menu to add it to the share menu."
    : info.ios
      ? "iOS doesn’t allow web apps in the share sheet. Use Share, then Copy Link, then Paste & save in Kivo."
      : "On desktop, paste links into Save.";

  return (
    <section className="flex gap-4 rounded-2xl border bg-card p-5">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <MobileIcon size={20} />
      </span>
      <div className="text-sm">
        <h2 className="font-medium">This device</h2>
        <p className="mt-0.5 text-muted-foreground">{info.installed ? "Installed as an app" : "Running in the browser"}</p>
        <p className="mt-2 text-muted-foreground">{shareSupport}</p>
      </div>
    </section>
  );
}
