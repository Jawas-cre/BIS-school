"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Card with a chart/table toggle so every value is reachable without hovering. */
export function ChartCard({
  title,
  subtitle,
  legend,
  table,
  children,
  className,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  legend?: ReactNode;
  table: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <section className={cn("rounded-2xl border border-line bg-surface shadow-card", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <h3 className="font-display text-[15px] font-bold text-ink">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {action}
          <div className="flex rounded-lg border border-line bg-surface-2 p-0.5" role="group" aria-label="View">
            {(["chart", "table"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold capitalize transition-colors",
                  view === v ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
                )}
              >
                {v === "chart" ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      {legend && view === "chart" && <div className="flex flex-wrap gap-4 px-5 pt-3 text-xs font-medium text-ink-2">{legend}</div>}
      <div className="p-5 pt-4">{view === "chart" ? children : <div className="max-h-80 overflow-auto">{table}</div>}</div>
    </section>
  );
}

export function LegendKey({ color, label, shape = "rect" }: { color: string; label: string; shape?: "rect" | "line" }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden
        className={shape === "line" ? "h-0.5 w-4 rounded-full" : "size-2.5 rounded-[3px]"}
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-line text-left text-xs text-muted">
          {head.map((h, i) => (
            <th key={h} className={cn("py-2 pr-3 font-semibold", i > 0 && "text-right")}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-line last:border-0">
            {r.map((c, j) => (
              <td key={j} className={cn("py-2 pr-3", j > 0 && "text-right tabular-nums")}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
