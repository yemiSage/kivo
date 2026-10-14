"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { XIcon } from "./icons";

export function TagInput({ value, onChange, id = "tags", inputClassName }: { value: string[]; onChange: (tags: string[]) => void; id?: string; inputClassName?: string }) {
  const [draft, setDraft] = useState("");

  const commit = (raw: string) => {
    const parts = raw
      .split(/[,\n]/)
      .map((t) => t.trim().replace(/^#+/, "").toLowerCase().replace(/\s+/g, "-"))
      .filter(Boolean);
    if (!parts.length) return;
    onChange([...new Set([...value, ...parts])].slice(0, 20));
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Tags</Label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1 transition focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/15">
        {value.map((t) => (
          <span key={t} className="flex h-7 items-center gap-1 rounded-md bg-secondary pl-2 pr-1 text-xs font-medium">
            #{t}
            <button type="button" aria-label={`Remove tag ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="rounded p-0.5 text-muted-foreground hover:text-foreground">
              <XIcon size={14} />
            </button>
          </span>
        ))}
        <input
          id={id}
          name={id}
          autoComplete="off"
          spellCheck={false}
          value={draft}
          onChange={(e) => (e.target.value.endsWith(",") ? commit(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
          placeholder={value.length ? "" : "design, ideas, to-try…"}
          enterKeyHint="done"
          autoCapitalize="none"
          className={cn("h-8 min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground", inputClassName)}
        />
      </div>
      <p className="text-xs text-muted-foreground">Press Enter or comma to add.</p>
    </div>
  );
}
