import { CalendarDays, Trash2 } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { deleteLesson, saveLesson } from "../../_actions/journal";
import { GRADES, STATUSES, recentLessons, type AttendanceStatus } from "@/lib/journal";
import { dayKey } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

const STATUS_STYLE: Record<AttendanceStatus, string> = {
  PRESENT: "has-[:checked]:border-success has-[:checked]:bg-success-soft has-[:checked]:text-success",
  LATE: "has-[:checked]:border-warning has-[:checked]:bg-warning-soft has-[:checked]:text-warning",
  ABSENT: "has-[:checked]:border-danger has-[:checked]:bg-danger-soft has-[:checked]:text-danger",
  EXCUSED: "has-[:checked]:border-line-strong has-[:checked]:bg-surface-2 has-[:checked]:text-ink",
};
const DOT: Record<string, string> = { PRESENT: "bg-success", LATE: "bg-warning", ABSENT: "bg-danger", EXCUSED: "bg-line-strong" };

/**
 * The group's journal: pick a day, mark who came and give 1–5 grades, and see the latest lessons at a
 * glance. Shown on the group page in both the admin and the teacher panel.
 */
export async function JournalCard({ groupId, day, base, members }: { groupId: string; day: string; base: string; members: { id: string; name: string }[] }) {
  const { t, date } = await getI18n();
  const J = t.journal;
  const lessons = await recentLessons(groupId, 10);
  const current = lessons.find((l) => l.day === day);
  const marks = new Map(current?.attendance.map((a) => [a.userId, a]) ?? []);
  const columns = [...lessons].reverse();
  const short = (d: string) => date(d, { year: undefined });

  return (
    <Card id="journal">
      <CardHeader title={J.title} subtitle={J.subtitle} action={<CalendarDays className="size-4 text-muted" />} />
      <CardBody className="space-y-6">
        <form action={`${base}/groups/${groupId}#journal`} className="flex flex-wrap items-end gap-2">
          <Field label={J.day}>
            <Input type="date" name="day" defaultValue={day} max={dayKey()} className="w-44" />
          </Field>
          <button className="h-11 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold hover:bg-surface-2">{J.open}</button>
          {current && <span className="pb-3 text-sm text-muted">{fmt(J.editing, { day: short(day) })}</span>}
        </form>

        {members.length === 0 ? (
          <p className="text-sm text-muted">{t.adminGroups.noMembers}</p>
        ) : (
          <ActionForm action={saveLesson.bind(null, groupId)} submitLabel={J.save} className="space-y-4">
            <input type="hidden" name="day" value={day} />
            <Field label={J.topic}>
              <Input name="topic" defaultValue={current?.topic ?? ""} placeholder={J.topicPlaceholder} />
            </Field>
            <ul className="divide-y divide-line rounded-xl border border-line">
              {members.map((m) => {
                const mark = marks.get(m.id);
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5">
                    <span className="min-w-36 flex-1 truncate text-sm font-semibold">{m.name}</span>
                    <span className="flex flex-wrap gap-1" role="radiogroup" aria-label={fmt(J.statusFor, { name: m.name })}>
                      {STATUSES.map((s) => (
                        <label key={s} className={cn("cursor-pointer rounded-lg border border-line px-2.5 py-1 text-xs font-semibold text-muted", STATUS_STYLE[s])}>
                          <input type="radio" name={`status_${m.id}`} value={s} defaultChecked={(mark?.status ?? "PRESENT") === s} className="sr-only" />
                          {J.status[s]}
                        </label>
                      ))}
                    </span>
                    <select
                      name={`grade_${m.id}`}
                      defaultValue={mark?.grade ?? ""}
                      aria-label={fmt(J.gradeFor, { name: m.name })}
                      className="h-8 rounded-lg border border-line bg-surface px-2 text-sm"
                    >
                      <option value="">{J.noGrade}</option>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          </ActionForm>
        )}

        {columns.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">{J.latest}</h3>
              {current && (
                <ConfirmAction action={deleteLesson.bind(null, groupId, current.id)} label={J.deleteLesson} confirm={fmt(J.deleteConfirm, { day: short(day) })}>
                  <Trash2 className="size-4" />
                </ConfirmAction>
              )}
            </div>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-muted">
                    <th className="px-3 py-2 text-left font-semibold">{J.student}</th>
                    {columns.map((l) => (
                      <th key={l.id} className={cn("px-1.5 py-2 text-center font-semibold whitespace-nowrap", l.day === day && "text-brand")} title={l.topic ?? ""}>
                        <a href={`${base}/groups/${groupId}?day=${l.day}#journal`} className="hover:underline">{short(l.day)}</a>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-line last:border-0">
                      <td className="max-w-40 truncate px-3 py-2 font-semibold">{m.name}</td>
                      {columns.map((l) => {
                        const a = l.attendance.find((x) => x.userId === m.id);
                        return (
                          <td key={l.id} className="px-1.5 py-2 text-center" title={a ? J.status[a.status as AttendanceStatus] : ""}>
                            {a ? (
                              <span className="inline-flex items-center gap-1">
                                <span className={cn("size-2 rounded-full", DOT[a.status])} />
                                {a.grade && <span className="font-bold tabular-nums">{a.grade}</span>}
                              </span>
                            ) : (
                              <span className="text-muted">·</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
              {STATUSES.map((s) => (
                <span key={s} className="inline-flex items-center gap-1">
                  <span className={cn("size-2 rounded-full", DOT[s])} /> {J.status[s]}
                </span>
              ))}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
