import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "brand" | "success" | "danger" | "warning";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-2 border-line",
  brand: "bg-brand-soft text-brand border-transparent",
  success: "bg-success-soft text-success border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
};

export function Badge({ tone = "neutral", className, ...props }: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
