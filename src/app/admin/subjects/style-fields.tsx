"use client";

import { useState } from "react";
import { SUBJECT_ICONS, SubjectIcon } from "@/components/subject-icon";
import { cn } from "@/lib/utils";

const COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#ea580c", "#059669", "#b45309", "#db2777", "#0d9488", "#4f46e5", "#dc2626"];

export function SubjectStyleFields({ color: initialColor, icon: initialIcon }: { color: string; icon: string }) {
  const [color, setColor] = useState(initialColor);
  const [icon, setIcon] = useState(initialIcon);
  return (
    <div className="space-y-3">
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="icon" value={icon} />
      <div>
        <span className="mb-1.5 block text-sm font-semibold">Color</span>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={`Use ${c}`} onClick={() => setColor(c)} className={cn("size-7 rounded-full ring-offset-2 ring-offset-[var(--surface)]", color === c && "ring-2 ring-ink")} style={{ background: c }} />
          ))}
        </div>
      </div>
      <div>
        <span className="mb-1.5 block text-sm font-semibold">Icon</span>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(SUBJECT_ICONS).map((k) => (
            <button key={k} type="button" aria-label={k} onClick={() => setIcon(k)} className={cn("rounded-xl p-0.5", icon === k && "ring-2 ring-ink")}>
              <SubjectIcon icon={k} color={color} size={34} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
