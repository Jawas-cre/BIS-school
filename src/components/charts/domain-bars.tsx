"use client";

import { ChartCard, DataTable, LegendKey } from "./chart-card";

export type DomainRow = { section: string; domain: string; you: number | null; group: number | null; attempts: number };

function Bar({ value, color }: { value: number | null; color: string }) {
  return (
    <div className="flex h-2.5 items-center gap-2">
      <div className="relative h-full flex-1">
        {value !== null && (
          <div
            className="absolute inset-y-0 left-0 rounded-r-[4px]"
            style={{ width: `${Math.max(value, 1.5)}%`, background: color }}
          />
        )}
      </div>
      <span className="w-9 text-right text-xs font-semibold text-ink-2 tabular-nums">{value === null ? "—" : `${value}%`}</span>
    </div>
  );
}

export function DomainBars({ rows, showGroup }: { rows: DomainRow[]; showGroup: boolean }) {
  const sections = [...new Set(rows.map((r) => r.section))];
  return (
    <ChartCard
      title="Accuracy by domain"
      subtitle={showGroup ? "Share of questions answered correctly — you vs. your group" : "Share of questions answered correctly"}
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
          head={showGroup ? ["Domain", "Questions", "You", "Group"] : ["Domain", "Questions", "You"]}
          rows={rows.map((r) => [
            r.domain,
            r.attempts,
            r.you === null ? "—" : `${r.you}%`,
            ...(showGroup ? [r.group === null ? "—" : `${r.group}%`] : []),
          ])}
        />
      }
    >
      <div className="space-y-5">
        {sections.map((section) => (
          <div key={section}>
            <div className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">{section}</div>
            <div className="space-y-3">
              {rows
                .filter((r) => r.section === section)
                .map((r) => (
                  <div
                    key={r.domain}
                    tabIndex={0}
                    className="group relative rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="truncate font-medium text-ink">{r.domain}</span>
                      <span className="shrink-0 text-xs text-muted">{r.attempts} answered</span>
                    </div>
                    <div className="space-y-[2px]">
                      <Bar value={r.you} color="var(--series-1)" />
                      {showGroup && <Bar value={r.group} color="var(--series-2)" />}
                    </div>
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute -top-2 right-10 z-10 hidden -translate-y-full rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop group-hover:block group-focus-visible:block"
                    >
                      <div className="font-semibold text-ink">{r.domain}</div>
                      <div className="mt-1 flex items-center gap-2 text-ink-2">
                        <span className="h-0.5 w-3 rounded-full bg-series-1" />
                        <strong className="text-ink">{r.you ?? "—"}%</strong> you
                      </div>
                      {showGroup && (
                        <div className="flex items-center gap-2 text-ink-2">
                          <span className="h-0.5 w-3 rounded-full bg-series-2" />
                          <strong className="text-ink">{r.group ?? "—"}%</strong> group
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
