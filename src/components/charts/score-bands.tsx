"use client";

import { ChartCard, DataTable } from "./chart-card";

const BANDS = [
  { label: "< 1000", min: 0, max: 999 },
  { label: "1000–1090", min: 1000, max: 1099 },
  { label: "1100–1190", min: 1100, max: 1199 },
  { label: "1200–1290", min: 1200, max: 1299 },
  { label: "1300–1390", min: 1300, max: 1399 },
  { label: "1400–1490", min: 1400, max: 1499 },
  { label: "1500+", min: 1500, max: 1600 },
];

/** Histogram of students' latest full-test scores (single series). */
export function ScoreBands({ scores }: { scores: number[] }) {
  const counts = BANDS.map((b) => ({ ...b, n: scores.filter((s) => s >= b.min && s <= b.max).length }));
  const max = Math.max(1, ...counts.map((c) => c.n));
  return (
    <ChartCard
      title="Score distribution"
      subtitle={`Latest full-length mock score · ${scores.length} students`}
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
