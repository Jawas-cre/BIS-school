"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** A small header menu for picking one option (language, color mode). */
export function ChoiceMenu<T extends string>({
  label,
  trigger,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  trigger: ReactNode;
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 min-w-9 items-center justify-center gap-1 rounded-xl px-2 text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute top-full right-0 z-50 mt-1.5 w-52 animate-fade-up rounded-xl border border-line bg-surface p-1 shadow-pop"
        >
          <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-bold tracking-wider text-muted uppercase">{label}</div>
          {options.map((o) => {
            const selected = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setOpen(false);
                  if (!selected) onChange(o.value);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-semibold transition-colors",
                  selected ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )}
              >
                {o.icon}
                <span className="flex-1">{o.label}</span>
                {selected && <Check className="size-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
