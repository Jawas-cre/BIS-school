"use client";

import Link from "next/link";
import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard, DataTable } from "./chart-card";
import { useT } from "@/lib/i18n/client";

export type ScorePoint = { label: string; title: string; subject: string; score: number };

function TooltipBody({ active, payload }: { active?: boolean; payload?: { payload: ScorePoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5 text-xs shadow-pop">
      <div className="font-display text-lg font-extrabold text-ink">{p.score}%</div>
      <div className="text-ink-2">{p.title}</div>
      <div className="text-muted">{p.subject} · {p.label}</div>
    </div>
  );
}

/** Test results over time, as percent correct (single series). */
export function ScoreTrend({ data, title, subtitle }: { data: ScorePoint[]; title?: string; subtitle?: string }) {
  const t = useT();
  const c = t.charts;
  const last = data.length - 1;
  return (
    <ChartCard
      title={title ?? c.testResults}
      subtitle={subtitle ?? c.testResultsSub}
      table={<DataTable head={[c.colTest, c.colSubject, c.colDate, c.colScore]} rows={data.map((d) => [d.title, d.subject, d.label, `${d.score}%`])} />}
    >
      {data.length === 0 ? (
        <div className="grid h-64 place-items-center rounded-xl border border-dashed border-line-strong text-center">
          <div>
            <p className="font-semibold text-ink">{c.noTests}</p>
            <p className="mt-1 text-sm text-muted">{c.noTestsText}</p>
            <Link href="/tests" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">{c.browseTests}</Link>
          </div>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 18, right: 40, bottom: 0, left: -8 }}>
              <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
              <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "var(--chart-axis)" }} tick={{ fill: "var(--muted)", fontSize: 12 }} dy={6} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} width={48} />
              <Tooltip content={<TooltipBody />} cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }} />
              <Line
                type="linear"
                dataKey="score"
                stroke="var(--series-1)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, fill: "var(--series-1)", stroke: "var(--surface)", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "var(--series-1)", stroke: "var(--surface)", strokeWidth: 2 }}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="score"
                  content={({ x, y, value, index }) =>
                    index === last ? (
                      <text x={Number(x) + 10} y={Number(y) + 4} fill="var(--text)" fontSize={13} fontWeight={700}>
                        {value}%
                      </text>
                    ) : null
                  }
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
