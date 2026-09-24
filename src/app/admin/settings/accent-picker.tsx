"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const PRESETS = ["#2563eb", "#4f46e5", "#7c3aed", "#0891b2", "#059669", "#ea580c", "#db2777", "#0f172a"];

export function AccentPicker({ defaultValue }: { defaultValue: string }) {
  const [color, setColor] = useState(defaultValue);
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold">Accent color</span>
      <input type="hidden" name="accent" value={color} />
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            aria-label={`Use ${c}`}
            className={cn("size-8 rounded-full ring-offset-2 ring-offset-[var(--surface)]", color === c && "ring-2 ring-ink")}
            style={{ background: c }}
          />
        ))}
        <label className="flex items-center gap-2 rounded-xl border border-line px-2 py-1 text-sm">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="size-6 cursor-pointer rounded border-0 bg-transparent p-0" />
          <span className="font-mono text-xs">{color}</span>
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-line p-3">
        <span className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white" style={{ background: color }}>Primary button</span>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}>Badge</span>
        <span className="text-sm text-muted">Preview</span>
      </div>
    </div>
  );
}
