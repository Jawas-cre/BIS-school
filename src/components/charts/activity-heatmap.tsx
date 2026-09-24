"use client";

import { useState } from "react";
import { ChartCard, DataTable } from "./chart-card";
import { useI18n } from "@/lib/i18n/client";
import { fmt, plural, rich } from "@/lib/i18n/format";

export type ActivityCell = { day: string; questions: number; correct: number };

const LEVELS = ["var(--heat-0)", "var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)"];

function level(n: number) {
  if (n === 0) return 0;
  if (n < 10) return 1;
  if (n < 20) return 2;
  if (n < 35) return 3;
  return 4;
}

/** GitHub-style practice calendar; `days` must be consecutive, oldest first, starting on a Monday. */
export function ActivityHeatmap({ days, streak, best }: { days: ActivityCell[]; streak: number; best: number }) {
  const [hover, setHover] = useState<ActivityCell | null>(null);
  const { t, date } = useI18n();
  const c = t.charts;
  const day = (d: string) => date(`${d}T12:00:00Z`, { year: undefined, timeZone: "UTC" });
  const weeks: ActivityCell[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  const active = days.filter((d) => d.questions > 0);
  const total = active.reduce((s, d) => s + d.questions, 0);

  return (
    <ChartCard
      title={c.practiceActivity}
      subtitle={`${plural(c.activeDays, active.length)} · ${fmt(c.inLastWeeks, { questions: plural(t.common.questions, total), weeks: weeks.length })}`}
      table={
        <DataTable
          head={[c.colDay, c.colQuestions, c.colAccuracy]}
          rows={[...active].reverse().map((d) => [day(d.day), d.questions, `${Math.round((d.correct / d.questions) * 100)}%`])}
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
                    aria-label={`${day(d.day)}: ${plural(t.common.questions, d.questions)}`}
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
                  {rich(c.dayOn, { questions: <strong className="text-ink">{plural(t.common.questions, hover.questions)}</strong>, date: day(hover.day) })}
                  {hover.questions > 0 && ` · ${fmt(c.correctPct, { pct: Math.round((hover.correct / hover.questions) * 100) })}`}
                </>
              ) : (
                c.hoverHint
              )}
            </span>
            <span className="flex items-center gap-1">
              {c.less}
              {LEVELS.map((c) => (
                <span key={c} className="size-[11px] rounded-[3px]" style={{ background: c }} />
              ))}
              {c.more}
            </span>
          </div>
        </div>
        <div className="flex gap-6">
          <div>
            <div className="text-xs font-semibold text-muted">{c.currentStreak}</div>
            <div className="font-display text-2xl font-extrabold text-ink">{plural(t.common.days, streak)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted">{c.bestStreak}</div>
            <div className="font-display text-2xl font-extrabold text-ink">{plural(t.common.days, best)}</div>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
