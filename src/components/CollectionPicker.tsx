"use client";
import { useState, useTransition } from "react";
import { createCollection } from "@/app/actions";
import type { Collection } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckIcon, FolderIcon, PlusIcon } from "./icons";
import { useToast } from "./Toast";
import { LoadingSpinner } from "./LoadingSpinner";

/** Single-select chip row with inline "new collection". */
export function CollectionPicker({
  collections: initial,
  value,
  onChange,
  label = "Vault",
  helper,
}: {
  collections: Collection[];
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  helper?: string;
}) {
  const [collections, setCollections] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();

  const add = () => {
    if (pending || !name.trim()) return;
    start(async () => {
      const res = await createCollection(name);
      if (!res.ok) return toast(res.error, "error");
      setCollections((c) => [...c, res.data.collection]);
      onChange(res.data.collection.id);
      setName("");
      setAdding(false);
    });
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 md:mx-0 md:flex-wrap md:px-0" role="radiogroup" aria-label={label}>
        {collections.map((c) => {
          const on = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(on ? null : c.id)}
              className={cn(
                "flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.98]",
                on ? "border-black bg-background text-black ring-1 ring-black" : "bg-background text-foreground hover:bg-secondary",
              )}
            >
              {on ? <CheckIcon size={16} variant="Bold" /> : <FolderIcon size={16} className="text-muted-foreground" />}
              {c.name}
            </button>
          );
        })}
        {adding ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <Input
              autoFocus
              name="vaultName"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  add();
                }
              }}
              onBlur={() => !name && setAdding(false)}
              placeholder="Vault name"
              maxLength={60}
              aria-label="New vault name"
              className="w-44"
            />
            <Button type="button" onClick={add} disabled={pending || !name.trim()}>
              {pending ? <><LoadingSpinner className="size-5" label="Adding vault" /> Adding…</> : "Add"}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-dashed px-3 text-sm text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <PlusIcon size={16} /> New
          </button>
        )}
      </div>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </fieldset>
  );
}
