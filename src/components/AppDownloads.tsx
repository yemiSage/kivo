"use client";

import { useState } from "react";
import { usePwaInstall } from "@/lib/pwa-install";
import { isIOS } from "./PwaClient";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { MobileIcon, ExternalIcon } from "./icons";

export function AppDownloads() {
  const { installed, available, install } = usePwaInstall();
  const [guide, setGuide] = useState<"ios" | "android" | "extension" | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <section className="rounded-2xl border bg-card p-3" aria-labelledby="app-downloads">
      <h2 id="app-downloads" className="font-medium">Get Kivo</h2>
      <div className="mt-3 hidden flex-wrap items-center gap-3 md:flex">
        <Button asChild variant="outline"><a href="/downloads/kivo-chrome-extension.zip" download><ExternalIcon size={18} />Download Chrome extension</a></Button>
        <button type="button" className="text-xs text-muted-foreground underline underline-offset-4" onClick={()=>setGuide("extension")}>Installation steps</button>
      </div>
      <div className="mt-3 md:hidden">
        <Button variant="outline" disabled={installed || busy} onClick={async()=>{
          if (available) { setBusy(true); try { if (await install()) return; } finally { setBusy(false); } }
          setGuide(isIOS() ? "ios" : "android");
        }}><MobileIcon size={18}/>{installed ? "PWA installed" : busy ? "Opening…" : "Download PWA"}</Button>
      </div>
      <Dialog open={guide !== null} onOpenChange={open=>{if(!open)setGuide(null);}}>
        <DialogContent>
          <DialogHeader><DialogTitle>{guide === "extension" ? "Install the Chrome extension" : "Add Kivo to your home screen"}</DialogTitle><DialogDescription>{guide === "extension" ? "Install the downloaded package in desktop Chrome." : "Install Kivo from your browser."}</DialogDescription></DialogHeader>
          {guide === "extension" ? <ol className="list-decimal space-y-2 pl-5 text-sm"><li>Download and unzip the Kivo extension.</li><li>Open <code>chrome://extensions</code> in Chrome.</li><li>Enable Developer mode, choose Load unpacked, and select the extracted folder containing manifest.json.</li><li>Pin Kivo from Chrome’s extensions menu.</li></ol> : guide === "ios" ? <ol className="list-decimal space-y-2 pl-5 text-sm"><li>Open Kivo in Safari.</li><li>Tap Share, then Add to Home Screen.</li><li>Tap Add to install Kivo.</li></ol> : <ol className="list-decimal space-y-2 pl-5 text-sm"><li>Open Kivo in Chrome.</li><li>Open the browser menu and choose Install app or Add to Home screen.</li><li>Confirm installation when prompted.</li></ol>}
        </DialogContent>
      </Dialog>
    </section>
  );
}
