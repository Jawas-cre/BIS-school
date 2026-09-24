"use client";

import Link from "next/link";
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard, DataTable, LegendKey } from "./chart-card";

export type ScorePoint = { label: string; title: string; total: number; rw: number; math: number };

function TooltipBody({ active, payload }: { active?: boolean; payload?: { payload: ScorePoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5 text-xs shadow-pop">
      <div className="font-display text-lg font-extrabold text-ink">{p.total}</div>
      <div className="text-muted">{p.title} · {p.label}</div>
      <div className="mt-1.5 space-y-0.5 text-ink-2">
        <div className="flex justify-between gap-6"><span>Reading & Writing</span><strong className="text-ink">{p.rw}</strong></div>
        <div className="flex justify-between gap-6"><span>Math</span><strong className="text-ink">{p.math}</strong></div>
      </div>
    </div>
  );
}

export function ScoreTrend({ data, goal }: { data: ScorePoint[]; goal: number | null }) {
  const values = data.map((d) => d.total).concat(goal ? [goal] : []);
  const min = Math.max(400, Math.floor((Math.min(...values) - 80) / 100) * 100);
  const ticks: number[] = [];
  for (let t = min; t <= 1600; t += min <= 800 ? 200 : 100) ticks.push(t);
  const last = data.length - 1;

  return (
    <ChartCard
      title="Score trajectory"
      subtitle={goal ? `Total score on full-length mock tests, against your goal of ${goal}` : "Total score on full-length mock tests"}
      legend={goal ? <LegendKey color="var(--muted)" label={`Goal · ${goal}`} shape="line" /> : undefined}
      table={
        <DataTable
          head={["Test", "Date", "R&W", "Math", "Total"]}
          rows={data.map((d) => [d.title, d.label, d.rw, d.math, d.total])}
        />
      }
    >
      {data.length === 0 ? (
        <div className="grid h-64 place-items-center rounded-xl border border-dashed border-line-strong text-center">
          <div>
            <p className="font-semibold text-ink">No full-length tests yet</p>
            <p className="mt-1 text-sm text-muted">Your score trajectory appears after your first full-length mock test.</p>
            <Link href="/tests" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">Browse mock tests →</Link>
          </div>
        </div>
      ) : (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 18, right: 40, bottom: 0, left: -8 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--chart-axis)" }}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              dy={6}
            />
            <YAxis
              domain={[min, 1600]}
              ticks={ticks}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              width={48}
            />
            {goal && (
              <ReferenceLine
                y={goal}
                stroke="var(--muted)"
                strokeDasharray="4 4"
                label={{ value: "Goal", position: "insideTopLeft", fill: "var(--muted)", fontSize: 11 }}
              />
            )}
            <Tooltip content={<TooltipBody />} cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }} />
            <Line
              type="linear"
              dataKey="total"
              stroke="var(--series-1)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={{ r: 4, fill: "var(--series-1)", stroke: "var(--surface)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "var(--series-1)", stroke: "var(--surface)", strokeWidth: 2 }}
              isAnimationActive={false}
            >
              <LabelList
                dataKey="total"
                content={({ x, y, value, index }) =>
                  index === last ? (
                    <text x={Number(x) + 10} y={Number(y) + 4} fill="var(--text)" fontSize={13} fontWeight={700}>
                      {value}
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
