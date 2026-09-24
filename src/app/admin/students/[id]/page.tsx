import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { liveStreak } from "@/lib/activity";
import { activityCalendar, subjectComparison, userTotals } from "@/lib/stats";
import { roadmapOverview } from "@/lib/roadmap";
import { enrolledSubjectIds, visibleSubjects } from "@/lib/subjects";
import { Avatar, Progress, StatTile } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { SubjectIcon } from "@/components/subject-icon";
import { ScoreTrend } from "@/components/charts/score-trend";
import { SubjectBars } from "@/components/charts/subject-bars";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { removeStudent, resetStudentPassword, updateStudent } from "../../_actions/people";
import { pct } from "@/lib/utils";
import { fmt } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.adminStudent.title);

export default async function StudentDetail({ params }: PageProps<"/admin/students/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const { t, date, num } = await getI18n();
  const S = t.adminStudent;
  const student = await db.user.findFirst({
    where: { id, centerId: staff.centerId, role: "STUDENT" },
    include: { targetUni: true, memberships: { include: { group: { include: { subject: true } } } } },
  });
  if (!student) notFound();
  const subjects = await visibleSubjects(staff.centerId);
  const enrolled = enrolledSubjectIds(student);
  const shown = enrolled.length ? subjects.filter((s) => enrolled.includes(s.id)) : subjects;

  const [totals, comparison, calendar, attempts, overview, groups, branches] = await Promise.all([
    userTotals(student.id),
    subjectComparison(student.id, [], subjects),
    activityCalendar(student.id),
    db.testAttempt.findMany({ where: { userId: student.id, status: "COMPLETED" }, orderBy: { finishedAt: "asc" }, include: { test: { select: { title: true, subject: { select: { name: true } } } } } }),
    roadmapOverview(student, shown.map((s) => s.id)),
    db.group.findMany({ where: { centerId: staff.centerId }, orderBy: { name: "asc" }, include: { subject: { select: { name: true } } } }),
    db.branch.findMany({ where: { centerId: staff.centerId }, orderBy: { name: "asc" } }),
  ]);
  const memberOf = new Set(student.memberships.map((m) => m.groupId));

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/admin/students" className="hover:text-ink">{t.nav.students}</Link>
        <ChevronRight className="size-3.5" />
        <span>{student.name}</span>
      </nav>

      <div className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6 shadow-card sm:flex-row sm:items-center">
        <Avatar name={student.name} size={64} />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-extrabold">{student.name}</h1>
          <p className="text-sm text-muted">{student.email}{student.phone ? ` · ${student.phone}` : ""}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {student.grade && <Badge>{student.grade}</Badge>}
            {student.memberships.map((m) => <Badge key={m.groupId} tone="brand">{m.group.name}</Badge>)}
            {student.targetUni && <Badge>{student.targetUni.name}</Badge>}
            {student.examDate && <Badge>{fmt(S.exam, { date: date(student.examDate) })}</Badge>}
          </div>
          {student.goal && <p className="mt-2 text-sm text-ink-2">{fmt(S.goal, { goal: student.goal })}</p>}
        </div>
        {staff.role === "CENTER_ADMIN" && (
          <ConfirmAction action={removeStudent.bind(null, student.id)} label={S.removeLabel} confirm={fmt(S.removeConfirm, { name: student.name })}>
            <Trash2 className="size-4" /> {t.common.remove}
          </ConfirmAction>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label={S.avgTest} value={totals.avgTestScore !== null ? `${totals.avgTestScore}%` : "—"} hint={fmt(S.testsCount, { n: totals.tests })} />
        <StatTile label={S.accuracy} value={totals.answered ? `${totals.accuracy}%` : "—"} hint={fmt(S.answers, { n: num(totals.answered) })} />
        <StatTile label={S.roadmapUnits} value={totals.units} hint={S.completed} />
        <StatTile label={S.streak} value={liveStreak(student)} hint={fmt(S.best, { n: student.bestStreak })} />
        <StatTile label={S.wordsMastered} value={totals.mastered} hint={fmt(S.xp, { n: num(student.xp) })} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ScoreTrend
            data={attempts.map((a) => ({ label: date(a.finishedAt ?? a.startedAt, { year: undefined }), title: a.test.title, subject: a.test.subject?.name ?? t.common.mixed, score: a.score ?? 0 }))}
          />
        </div>
        <Card>
          <CardHeader title={S.editTitle} />
          <CardBody>
            <ActionForm action={updateStudent.bind(null, student.id)}>
              <Field label={t.auth.fullName}><Input name="name" defaultValue={student.name} required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.fields.phone}><Input name="phone" defaultValue={student.phone ?? ""} /></Field>
                <Field label={S.grade}><Input name="grade" defaultValue={student.grade ?? ""} /></Field>
              </div>
              <Field label={t.fields.branch}>
                <Select name="branchId" defaultValue={student.branchId ?? ""}>
                  <option value="">—</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">{t.adminStudents.groups}</legend>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
                  {groups.map((g) => (
                    <label key={g.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-surface-2">
                      <input type="checkbox" name="groupIds" value={g.id} defaultChecked={memberOf.has(g.id)} className="size-4 accent-[var(--brand)]" />
                      <span className="truncate">{g.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </ActionForm>
            {staff.role === "CENTER_ADMIN" && (
              <div className="mt-5 border-t border-line pt-4">
                <ActionForm action={resetStudentPassword.bind(null, student.id)} submitLabel={S.resetPassword} submitVariant="outline" pendingText={S.resetting}>
                  <p className="text-sm text-muted">{S.resetText}</p>
                </ActionForm>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SubjectBars rows={comparison} showGroup={false} />
        </div>
        <Card>
          <CardHeader title={S.roadmapProgress} />
          <CardBody className="space-y-4">
            {overview.map((o) => {
              const s = subjects.find((x) => x.id === o.subjectId)!;
              return (
                <div key={o.subjectId}>
                  <div className="mb-1.5 flex items-center gap-2 text-sm">
                    <SubjectIcon icon={s.icon} color={s.color} size={24} />
                    <span className="flex-1 font-medium">{s.name}</span>
                    <span className="text-xs text-muted tabular-nums">{o.done}/{o.total}</span>
                  </div>
                  <Progress value={pct(o.done, o.total)} tone="success" />
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <ActivityHeatmap days={calendar} streak={liveStreak(student)} best={student.bestStreak} />

      <Card>
        <CardHeader title={S.testHistory} />
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="py-2 pr-3 font-semibold">{t.charts.colTest}</th>
                <th className="py-2 pr-3 font-semibold">{t.charts.colSubject}</th>
                <th className="py-2 pr-3 font-semibold">{t.charts.colDate}</th>
                <th className="py-2 pr-3 text-right font-semibold">{t.tests.colCorrect}</th>
                <th className="py-2 text-right font-semibold">{t.charts.colScore}</th>
              </tr>
            </thead>
            <tbody>
              {[...attempts].reverse().map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="py-2 pr-3 font-medium">{a.test.title}</td>
                  <td className="py-2 pr-3 text-muted">{a.test.subject?.name ?? t.common.mixed}</td>
                  <td className="py-2 pr-3 text-muted">{date(a.finishedAt ?? a.startedAt)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{a.correct}/{a.total}</td>
                  <td className="py-2 text-right font-bold tabular-nums">{a.score}%</td>
                </tr>
              ))}
              {attempts.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted">{S.noTests}</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
