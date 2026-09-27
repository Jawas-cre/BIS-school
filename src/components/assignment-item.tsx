import Link from "next/link";
import { BookOpenCheck, CheckCircle2, ClipboardCheck, Map } from "lucide-react";
import type { studentAssignments } from "@/lib/assignments";
import { cn, dayKey } from "@/lib/utils";
import { fmt } from "@/lib/i18n/format";
import type { Dict } from "@/lib/i18n/dictionaries";
import type { Formatters } from "@/lib/i18n/format";

export type StudentAssignment = Awaited<ReturnType<typeof studentAssignments>>[number];

const ICON = { TEST: ClipboardCheck, UNIT: Map, PRACTICE: BookOpenCheck };

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** One assignment for a student: what, which group, when it's due, and a button to do it. */
export function AssignmentItem({ a, t, date, compact = false }: { a: StudentAssignment; t: Dict; date: Formatters["date"]; compact?: boolean }) {
  const A = t.assignments;
  const Icon = ICON[a.kind as keyof typeof ICON] ?? ClipboardCheck;
  const left = daysBetween(dayKey(), a.dueOn);
  const when =
    a.state === "done"
      ? a.progress.score !== null
        ? fmt(A.doneScore, { score: a.progress.score })
        : A.state.done
      : a.state === "overdue"
        ? fmt(A.overdueSince, { date: date(a.dueOn, { year: undefined }) })
        : left === 0
          ? A.dueToday
          : fmt(A.dueIn, { n: left });
  return (
    <div className={cn("flex items-center gap-3 rounded-2xl border bg-surface p-3.5 shadow-card", a.state === "overdue" ? "border-danger/40" : "border-line")}>
      <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", a.state === "done" ? "bg-success-soft text-success" : "bg-brand-soft text-brand")}>
        {a.state === "done" ? <CheckCircle2 className="size-5" /> : <Icon className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{a.title}</span>
        <span className="block truncate text-xs text-muted">
          {A.kind[a.kind as keyof typeof A.kind]} · {a.group.name}
          {!compact && a.kind === "PRACTICE" && a.state !== "done" && ` · ${fmt(A.practiceProgress, { n: a.progress.answered, total: a.questions ?? 0 })}`}
        </span>
        {!compact && a.note && <span className="mt-1 block text-sm text-ink-2">{a.note}</span>}
      </span>
      <span className={cn("hidden text-right text-xs font-semibold sm:block", a.state === "overdue" ? "text-danger" : a.state === "done" ? "text-success" : "text-muted")}>{when}</span>
      {a.state !== "done" && (
        <Link href={a.href} className="shrink-0 rounded-xl bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-strong">
          {A.start}
        </Link>
      )}
    </div>
  );
}
