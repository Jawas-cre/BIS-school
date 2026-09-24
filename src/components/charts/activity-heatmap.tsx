"use client";

import { useState } from "react";
import { ChartCard, DataTable } from "./chart-card";

export type ActivityCell = { day: string; questions: number; correct: number };

const LEVELS = ["var(--heat-0)", "var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)"];

function level(n: number) {
  if (n === 0) return 0;
  if (n < 10) return 1;
  if (n < 20) return 2;
  if (n < 35) return 3;
  return 4;
}

function fmt(day: string) {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** GitHub-style practice calendar; `days` must be consecutive, oldest first, starting on a Monday. */
export function ActivityHeatmap({ days, streak, best }: { days: ActivityCell[]; streak: number; best: number }) {
  const [hover, setHover] = useState<ActivityCell | null>(null);
  const weeks: ActivityCell[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const active = days.filter((d) => d.questions > 0);
  const total = active.reduce((s, d) => s + d.questions, 0);

  return (
    <ChartCard
      title="Practice activity"
      subtitle={`${active.length} active days · ${total.toLocaleString()} questions in the last ${weeks.length} weeks`}
      table={
        <DataTable
          head={["Day", "Questions", "Accuracy"]}
          rows={[...active].reverse().map((d) => [fmt(d.day), d.questions, `${Math.round((d.correct / d.questions) * 100)}%`])}
        />
      }
    >
      <div className="flex flex-wrap items-end gap-6">
        <div className="min-w-0 flex-1 overflow-x-auto pb-1">
          <div className="flex w-max gap-[3px]" onMouseLeave={() => setHover(null)}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((d) => (
                  <button
                    key={d.day}
                    type="button"
                    aria-label={`${fmt(d.day)}: ${d.questions} questions`}
                    onMouseEnter={() => setHover(d)}
                    onFocus={() => setHover(d)}
                    className="size-[15px] rounded-[3px] outline-none hover:ring-2 hover:ring-ink/30 focus-visible:ring-2 focus-visible:ring-brand"
                    style={{ background: LEVELS[level(d.questions)] }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex min-h-5 items-center justify-between gap-4 text-xs text-muted">
            <span className="text-ink-2">
              {hover ? (
                <>
                  <strong className="text-ink">{hover.questions} questions</strong> on {fmt(hover.day)}
                  {hover.questions > 0 && ` · ${Math.round((hover.correct / hover.questions) * 100)}% correct`}
                </>
              ) : (
                "Hover a day to see details"
              )}
            </span>
            <span className="flex items-center gap-1">
              Less
              {LEVELS.map((c) => (
                <span key={c} className="size-[11px] rounded-[3px]" style={{ background: c }} />
              ))}
              More
            </span>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <div className="text-xs font-semibold text-muted">Current streak</div>
            <div className="font-display text-2xl font-extrabold text-ink">{streak} days</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted">Best streak</div>
            <div className="font-display text-2xl font-extrabold text-ink">{best} days</div>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
