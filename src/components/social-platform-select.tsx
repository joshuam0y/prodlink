"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SocialPlatformIcon } from "@/components/social-platform-icon";
import { SOCIAL_PLATFORM_OPTIONS, type KnownSocialPlatformId } from "@/lib/social-platforms-data";

type Props = {
  value: KnownSocialPlatformId | null;
  onChange: (id: KnownSocialPlatformId) => void;
  /** Fixed platform ids already chosen in other rows (excludes custom). */
  disabledPlatformIds: Set<string>;
  buttonClassName: string;
};

export function SocialPlatformSelect({
  value,
  onChange,
  disabledPlatformIds,
  buttonClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [open]);

  const selected = value ? SOCIAL_PLATFORM_OPTIONS.find((p) => p.id === value) : null;

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={buttonClassName}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          {selected ? (
            <>
              <SocialPlatformIcon id={selected.id} className="h-5 w-5 shrink-0" />
              <span className="truncate">{selected.label}</span>
            </>
          ) : (
            <span className="truncate text-zinc-500">Choose platform</span>
          )}
        </span>
        <span className="shrink-0 text-zinc-500" aria-hidden>
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-zinc-950 py-1 shadow-[0_16px_48px_rgba(0,0,0,0.55)] ring-1 ring-white/5"
        >
          {SOCIAL_PLATFORM_OPTIONS.map((p) => {
            const disabled = p.id !== "custom" && disabledPlatformIds.has(p.id);
            const isSelected = value === p.id;
            return (
              <li key={p.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={disabled}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition ${
                    disabled
                      ? "cursor-not-allowed opacity-40"
                      : "cursor-pointer text-zinc-200 hover:bg-white/5"
                  } ${isSelected && !disabled ? "bg-amber-500/10 text-amber-200" : ""}`}
                  onClick={() => {
                    if (disabled) return;
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <SocialPlatformIcon id={p.id} className="h-5 w-5 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{p.label}</span>
                  {disabled ? (
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-zinc-600">Added</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
