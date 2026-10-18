"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "./BrandMark";
import { ShareIcon, XIcon } from "./icons";
import { deferUntilIdle } from "@/lib/defer-until-idle";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kivo:install-dismissed";

export function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Registers the service worker and shows a one-time install hint. */
export function PwaClient() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      return deferUntilIdle(() => {
        void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
      });
    }
  }, []);

  useEffect(() => {
    if (isStandalone()) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {}
    if (dismissed) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    // iOS has no install prompt API; show manual instructions after a moment.
    const t = isIOS() ? setTimeout(() => setShowIosHint(true), 1500) : undefined;
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setDeferred(null);
    setShowIosHint(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  if (!deferred && !showIosHint) return null;

  return (
    <div className="shadow-float animate-rise fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-sm items-center gap-3 rounded-2xl border bg-background p-3 md:bottom-6 md:left-auto md:right-6">
      <BrandMark size={40} />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">Install Kivo</p>
        {deferred ? (
          <p className="text-muted-foreground">Save straight from your share menu.</p>
        ) : (
          <p className="text-muted-foreground">
            In Safari, tap <ShareIcon size={14} className="-mt-0.5 inline" /> then Add to Home Screen.
          </p>
        )}
      </div>
      {deferred && (
        <Button
          onClick={async () => {
            await deferred.prompt();
            await deferred.userChoice;
            dismiss();
          }}
        >
          Install
        </Button>
      )}
      <Button variant="ghost" size="icon" onClick={dismiss} aria-label="Dismiss install hint">
        <XIcon size={18} />
      </Button>
    </div>
  );
}
