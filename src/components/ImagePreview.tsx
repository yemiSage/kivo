"use client";

import { useState, useTransition } from "react";
import { updateItem } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { EditIcon, ExternalIcon, XIcon } from "./icons";
import { LoadingSpinner } from "./LoadingSpinner";
import { useToast } from "./Toast";

export function ImagePreview({
  itemId,
  src,
  alt,
  initialX,
  initialY,
}: {
  itemId: string;
  src: string;
  alt: string;
  initialX: number;
  initialY: number;
}) {
  const [open, setOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [pending, start] = useTransition();
  const toast = useToast();

  const selectFocalPoint = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!adjusting) {
      setOpen(true);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const next = {
      x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
    };
    setPosition(next);
    start(async () => {
      const result = await updateItem(itemId, { imagePositionX: next.x, imagePositionY: next.y });
      if (!result.ok) toast(result.error, "error");
    });
  };

  return (
    <>
      <div className="group relative aspect-[4/3] w-full overflow-hidden bg-secondary md:aspect-auto">
        <button
          type="button"
          onClick={selectFocalPoint}
          className="relative block h-full w-full overflow-hidden text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          aria-label={adjusting ? "Choose the image focal point" : "View image full screen"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- signed uploads and arbitrary third-party hosts */}
          <img
            src={src}
            alt={alt}
            width={1200}
            height={900}
            fetchPriority="high"
            referrerPolicy="no-referrer"
            style={{ objectPosition: `${position.x}% ${position.y}%` }}
            className="h-full w-full object-cover md:max-h-[60vh] md:h-auto md:object-contain"
          />
          {adjusting && (
            <>
              <span className="absolute inset-x-3 top-3 rounded-full bg-black/75 px-3 py-2 text-center text-xs font-medium text-white">Tap the subject to position the crop</span>
              <span className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/50 shadow-lg" style={{ left: `${position.x}%`, top: `${position.y}%` }} />
            </>
          )}
        </button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute bottom-2 left-2 bg-background/90 shadow-sm backdrop-blur"
          onClick={() => setAdjusting((value) => !value)}
        >
          {pending ? <LoadingSpinner className="size-4" label="Saving focal point" /> : <EditIcon size={14} />}
          {adjusting ? "Done" : "Adjust crop"}
        </Button>
        {!adjusting && (
          <span className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white md:hidden">
            <ExternalIcon size={14} /> Full screen
          </span>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="inset-0 h-dvh w-screen max-w-none translate-x-0 translate-y-0 place-items-center overflow-hidden overscroll-contain rounded-none bg-black p-0 ring-0 sm:max-w-none"
        >
          <DialogTitle className="sr-only">Full-screen image</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element -- signed uploads and arbitrary third-party hosts */}
          <img src={src} alt={alt} width={1600} height={1200} referrerPolicy="no-referrer" className="max-h-dvh max-w-full object-contain" />
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] size-11 bg-black/60 text-white hover:bg-black/80 hover:text-white" aria-label="Close full-screen image">
              <XIcon size={20} />
            </Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
