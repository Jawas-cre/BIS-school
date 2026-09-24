"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

export function CopyButton({ text, label, absolute = false, className }: { text: string; label?: string; absolute?: boolean; className?: string }) {
  const [done, setDone] = useState(false);
  const t = useT();
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(absolute ? new URL(text, window.location.origin).toString() : text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className={cn("inline-flex h-10 items-center gap-1.5 rounded-xl border border-line-strong bg-surface px-3 text-sm font-semibold hover:bg-surface-2", className)}
    >
      {done ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      {done ? t.common.copied : (label ?? t.common.copy)}
    </button>
  );
}
