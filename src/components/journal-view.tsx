import { CalendarCheck, Star } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatTile } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { SubjectBadge } from "@/components/subject-icon";
import { attended, type AttendanceStatus } from "@/lib/journal";
import type { studentJournal } from "@/lib/journal";
import { fmt } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

type Entries = Awaited<ReturnType<typeof studentJournal>>;

const TONE: Record<AttendanceStatus, "success" | "warning" | "danger" | "neutral"> = { PRESENT: "success", LATE: "warning", ABSENT: "danger", EXCUSED: "neutral" };

function summarize(entries: Entries) {
  const counted = entries.filter((e) => e.status !== "EXCUSED");
  const grades = entries.map((e) => e.grade).filter((g): g is number => g !== null);
  return {
    rate: counted.length ? Math.round((counted.filter((e) => attended(e.status)).length / counted.length) * 100) : null,
    avgGrade: grades.length ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10 : null,
    lessons: entries.length,
  };
}

/** A student's attendance and grades: totals, one line per group, and the latest lessons. */
export async function JournalView({ entries, limit = 30 }: { entries: Entries; limit?: number }) {
  const { t, date } = await getI18n();
  const J = t.journal;
  const total = summarize(entries);
  const groups = [...new Map(entries.map((e) => [e.lesson.group.id, e.lesson.group])).values()];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatTile label={J.attendance} value={total.rate === null ? "—" : `${total.rate}%`} icon={<CalendarCheck className="size-4" />} hint={fmt(J.lessonsCount, { n: total.lessons })} />
        <StatTile label={J.avgGrade} value={total.avgGrade ?? "—"} icon={<Star className="size-4" />} />
      </div>
      {groups.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((g) => {
            const s = summarize(entries.filter((e) => e.lesson.group.id === g.id));
            return (
              <Card key={g.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{g.name}</div>
                  {g.subject && <SubjectBadge name={g.subject.name} color={g.subject.color} />}
                </div>
                <div className="text-right text-sm">
                  <div className="font-bold tabular-nums">{s.rate === null ? "—" : `${s.rate}%`}</div>
                  <div className="text-xs text-muted">{J.attendance}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-bold tabular-nums">{s.avgGrade ?? "—"}</div>
                  <div className="text-xs text-muted">{J.avgGrade}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <Card>
        <CardHeader title={J.latest} />
        <CardBody className="overflow-x-auto p-0">
          {entries.length === 0 ? (
            <p className="p-5 text-sm text-muted">{J.noLessons}</p>
          ) : (
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-2.5 font-semibold">{J.colDate}</th>
                  <th className="px-3 py-2.5 font-semibold">{J.colGroup}</th>
                  <th className="px-3 py-2.5 font-semibold">{J.colTopic}</th>
                  <th className="px-3 py-2.5 font-semibold">{J.colStatus}</th>
                  <th className="px-5 py-2.5 text-right font-semibold">{J.colGrade}</th>
                </tr>
              </thead>
              <tbody>
                {entries.slice(0, limit).map((e) => (
                  <tr key={e.lessonId} className="border-b border-line last:border-0">
                    <td className="px-5 py-2.5 whitespace-nowrap text-ink-2">{date(e.lesson.day, { weekday: "short" })}</td>
                    <td className="px-3 py-2.5 font-semibold">{e.lesson.group.name}</td>
                    <td className="px-3 py-2.5 text-ink-2">{e.lesson.topic ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={TONE[e.status as AttendanceStatus]}>{J.status[e.status as AttendanceStatus]}</Badge>
                    </td>
                    <td className="px-5 py-2.5 text-right font-bold tabular-nums">{e.grade ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
