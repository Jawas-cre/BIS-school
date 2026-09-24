import { cn } from "@/lib/utils";

/** Middle-50% SAT band on a 1000–1600 track, with an optional marker for the student's score. */
export function SatRange({ low, high, score, className }: { low: number; high: number; score?: number | null; className?: string }) {
  const min = 1000;
  const pos = (v: number) => ((Math.min(1600, Math.max(min, v)) - min) / (1600 - min)) * 100;
  return (
    <div className={cn("relative h-2 rounded-full bg-surface-3", className)} title={`Middle 50%: ${low}–${high}`}>
      <div className="absolute inset-y-0 rounded-full bg-[color-mix(in_srgb,var(--series-1)_40%,transparent)]" style={{ left: `${pos(low)}%`, width: `${pos(high) - pos(low)}%` }} />
      {score ? (
        <div className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-series-1" style={{ left: `${pos(score)}%` }} title={`Your latest score: ${score}`} />
      ) : null}
    </div>
  );
}

export function fitLabel(score: number | null | undefined, low: number, high: number) {
  if (!score) return null;
  if (score >= high) return { text: "Above range", tone: "success" as const };
  if (score >= low) return { text: "In range", tone: "warning" as const };
  return { text: "Below range", tone: "danger" as const };
}
