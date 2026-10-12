"use client";
import { toast } from "sonner";

type Tone = "success" | "error" | "info";

const show = (message: string, tone: Tone = "success") => {
  if (tone === "error") toast.error(message);
  else if (tone === "info") toast.info(message);
  else toast.success(message);
};

/** Thin wrapper over sonner so call sites stay `toast("Saved")` / `toast(msg, "error")`. */
export const useToast = () => show;
