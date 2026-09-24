"use client";

import { ChartCard, DataTable } from "./chart-card";

const BANDS = [
  { label: "< 40%", min: 0, max: 39 },
  { label: "40–49%", min: 40, max: 49 },
  { label: "50–59%", min: 50, max: 59 },
  { label: "60–69%", min: 60, max: 69 },
  { label: "70–79%", min: 70, max: 79 },
  { label: "80–89%", min: 80, max: 89 },
  { label: "90%+", min: 90, max: 100 },
];

/** Histogram of students' average test scores (single series). */
export function ScoreBands({ scores }: { scores: number[] }) {
  const counts = BANDS.map((b) => ({ ...b, n: scores.filter((s) => s >= b.min && s <= b.max).length }));
  const max = Math.max(1, ...counts.map((c) => c.n));
  return (
    <ChartCard
      title="Score distribution"
      subtitle={`Average test score per student · ${scores.length} students`}
      table={<DataTable head={["Score band", "Students"]} rows={counts.map((c) => [c.label, c.n])} />}
    >
      <div className="flex h-56 items-end gap-2 border-b border-[var(--chart-axis)] sm:gap-4">
        {counts.map((c) => (
          <div key={c.label} className="group relative flex h-full flex-1 flex-col items-center justify-end" tabIndex={0}>
            <span className="mb-1 text-xs font-semibold text-ink-2 tabular-nums">{c.n || ""}</span>
            <div
              className="w-full max-w-6 rounded-t-[4px] bg-series-1 transition-opacity group-hover:opacity-80"
              style={{ height: `${(c.n / max) * 85}%`, minHeight: c.n ? 4 : 0 }}
            />
            <div role="tooltip" className="pointer-events-none absolute -top-2 z-10 hidden -translate-y-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap shadow-pop group-hover:block group-focus-visible:block">
              <strong className="text-ink">{c.n}</strong> <span className="text-muted">students · {c.label}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-4">
        {counts.map((c) => (
          <span key={c.label} className="flex-1 text-center text-[11px] text-muted">{c.label}</span>
        ))}
      </div>
    </ChartCard>
  );
}
