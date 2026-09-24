"use client";

import { ChartCard, DataTable, LegendKey } from "./chart-card";

export type SubjectRow = { id: string; name: string; color: string; you: number | null; group: number | null; attempts: number };

function Bar({ value, color }: { value: number | null; color: string }) {
  return (
    <div className="flex h-2.5 items-center gap-2">
      <div className="relative h-full flex-1">
        {value !== null && <div className="absolute inset-y-0 left-0 rounded-r-[4px]" style={{ width: `${Math.max(value, 1.5)}%`, background: color }} />}
      </div>
      <span className="w-9 text-right text-xs font-semibold text-ink-2 tabular-nums">{value === null ? "—" : `${value}%`}</span>
    </div>
  );
}

/** Accuracy per subject: the student vs. the average of their group-mates. */
export function SubjectBars({ rows, showGroup, title = "Accuracy by subject" }: { rows: SubjectRow[]; showGroup: boolean; title?: string }) {
  return (
    <ChartCard
      title={title}
      subtitle={showGroup ? "Share of questions answered correctly — you vs. your group-mates" : "Share of questions answered correctly"}
      legend={
        showGroup ? (
          <>
            <LegendKey color="var(--series-1)" label="You" />
            <LegendKey color="var(--series-2)" label="Group average" />
          </>
        ) : undefined
      }
      table={
        <DataTable
          head={showGroup ? ["Subject", "Questions", "You", "Group"] : ["Subject", "Questions", "Accuracy"]}
          rows={rows.map((r) => [r.name, r.attempts, r.you === null ? "—" : `${r.you}%`, ...(showGroup ? [r.group === null ? "—" : `${r.group}%`] : [])])}
        />
      }
    >
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">Answer some questions to see your accuracy by subject.</p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} tabIndex={0} className="group relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand">
              <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
                <span className="flex items-center gap-2 truncate font-medium text-ink">
                  <span className="size-2 rounded-full" style={{ background: r.color }} aria-hidden />
                  {r.name}
                </span>
                <span className="shrink-0 text-xs text-muted">{r.attempts} answered</span>
              </div>
              <div className="space-y-[2px]">
                <Bar value={r.you} color="var(--series-1)" />
                {showGroup && <Bar value={r.group} color="var(--series-2)" />}
              </div>
              <div role="tooltip" className="pointer-events-none absolute -top-2 right-10 z-10 hidden -translate-y-full rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop group-hover:block group-focus-visible:block">
                <div className="font-semibold text-ink">{r.name}</div>
                <div className="mt-1 flex items-center gap-2 text-ink-2"><span className="h-0.5 w-3 rounded-full bg-series-1" /><strong className="text-ink">{r.you ?? "—"}%</strong> you</div>
                {showGroup && <div className="flex items-center gap-2 text-ink-2"><span className="h-0.5 w-3 rounded-full bg-series-2" /><strong className="text-ink">{r.group ?? "—"}%</strong> group</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}
