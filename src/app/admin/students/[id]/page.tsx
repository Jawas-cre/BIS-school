import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { liveStreak } from "@/lib/activity";
import { activityCalendar, domainComparison, userTotals } from "@/lib/stats";
import { roadmapFor } from "@/lib/roadmap";
import { Avatar, Progress, StatTile } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { ScoreTrend } from "@/components/charts/score-trend";
import { DomainBars } from "@/components/charts/domain-bars";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { removeStudent, resetStudentPassword, updateStudent } from "../../_actions/people";
import { formatDate, pct } from "@/lib/utils";

export const metadata: Metadata = { title: "Student" };

export default async function StudentDetail({ params }: PageProps<"/admin/students/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const student = await db.user.findFirst({ where: { id, centerId: staff.centerId, role: "STUDENT" }, include: { group: true, targetUni: true } });
  if (!student) notFound();

  const [totals, domains, calendar, attempts, units, groups, branches] = await Promise.all([
    userTotals(student.id),
    domainComparison(student.id, []),
    activityCalendar(student.id),
    db.testAttempt.findMany({ where: { userId: student.id, status: "COMPLETED" }, orderBy: { finishedAt: "asc" }, include: { test: { select: { title: true, kind: true } } } }),
    roadmapFor(student),
    db.group.findMany({ where: { centerId: staff.centerId }, orderBy: { name: "asc" } }),
    db.branch.findMany({ where: { centerId: staff.centerId }, orderBy: { name: "asc" } }),
  ]);
  const full = attempts.filter((a) => a.test.kind === "FULL" && a.totalScore);
  const unitsDone = units.filter((u) => u.completed).length;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/admin/students" className="hover:text-ink">Students</Link>
        <ChevronRight className="size-3.5" />
        <span>{student.name}</span>
      </nav>

      <div className="flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6 shadow-card sm:flex-row sm:items-center">
        <Avatar name={student.name} size={64} />
        <div className="flex-1">
          <h1 className="font-display text-2xl font-extrabold">{student.name}</h1>
          <p className="text-sm text-muted">{student.email}{student.phone ? ` · ${student.phone}` : ""}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {student.group && <Badge tone="brand">{student.group.name}</Badge>}
            {student.targetScore && <Badge>Goal {student.targetScore}</Badge>}
            {student.targetUni && <Badge>{student.targetUni.name}</Badge>}
            {student.examDate && <Badge>Exam {formatDate(student.examDate)}</Badge>}
          </div>
        </div>
        {staff.role === "CENTER_ADMIN" && (
          <ConfirmAction action={removeStudent.bind(null, student.id)} label="Remove student" confirm={`Remove ${student.name} and all of their progress? This cannot be undone.`}>
            <Trash2 className="size-4" /> Remove
          </ConfirmAction>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Latest score" value={full.at(-1)?.totalScore ?? "—"} hint={`${full.length} full tests`} />
        <StatTile label="Accuracy" value={`${totals.accuracy}%`} hint={`${totals.answered} answers`} />
        <StatTile label="Roadmap" value={`${unitsDone}/${units.length}`} hint={`${pct(unitsDone, units.length)}% complete`} />
        <StatTile label="Streak" value={liveStreak(student)} hint={`best ${student.bestStreak}`} />
        <StatTile label="Words mastered" value={totals.mastered} hint={`${student.xp.toLocaleString()} XP`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ScoreTrend
            goal={student.targetScore}
            data={full.map((a) => ({ label: formatDate(a.finishedAt ?? a.startedAt, { year: undefined }), title: a.test.title.replace("Full-Length ", ""), total: a.totalScore!, rw: a.rwScore ?? 0, math: a.mathScore ?? 0 }))}
          />
        </div>
        <Card>
          <CardHeader title="Edit student" />
          <CardBody>
            <ActionForm action={updateStudent.bind(null, student.id)}>
              <Field label="Full name"><Input name="name" defaultValue={student.name} required /></Field>
              <Field label="Phone"><Input name="phone" defaultValue={student.phone ?? ""} /></Field>
              <Field label="Group">
                <Select name="groupId" defaultValue={student.groupId ?? ""}>
                  <option value="">No group</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </Select>
              </Field>
              <Field label="Branch">
                <Select name="branchId" defaultValue={student.branchId ?? ""}>
                  <option value="">—</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </Field>
            </ActionForm>
            {staff.role === "CENTER_ADMIN" && (
              <div className="mt-5 border-t border-line pt-4">
                <ActionForm action={resetStudentPassword.bind(null, student.id)} submitLabel="Reset password" submitVariant="outline" pendingText="Resetting…">
                  <p className="text-sm text-muted">Generates a new password you can share with the student.</p>
                </ActionForm>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DomainBars rows={domains} showGroup={false} />
        </div>
        <Card>
          <CardHeader title="Roadmap progress" />
          <CardBody className="space-y-2">
            <Progress value={pct(unitsDone, units.length)} tone="success" className="mb-3" />
            {units.map((u, i) => (
              <div key={u.id} className="flex items-center gap-2 text-sm">
                <span className="w-5 text-xs text-muted">{i + 1}</span>
                <span className="flex-1 truncate">{u.title}</span>
                {u.completed ? <Badge tone="success">{u.quizScore !== null ? `${u.quizScore}%` : "Done"}</Badge> : u.unlocked ? <Badge tone="brand">Open</Badge> : <Badge>Locked</Badge>}
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <ActivityHeatmap days={calendar} streak={liveStreak(student)} best={student.bestStreak} />

      <Card>
        <CardHeader title="Test history" />
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="py-2 pr-3 font-semibold">Test</th>
                <th className="py-2 pr-3 font-semibold">Date</th>
                <th className="py-2 pr-3 text-right font-semibold">Correct</th>
                <th className="py-2 text-right font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {[...attempts].reverse().map((a) => (
                <tr key={a.id} className="border-b border-line last:border-0">
                  <td className="py-2 pr-3 font-medium">{a.test.title}</td>
                  <td className="py-2 pr-3 text-muted">{formatDate(a.finishedAt ?? a.startedAt)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{a.correct}/{a.total}</td>
                  <td className="py-2 text-right font-bold tabular-nums">{a.totalScore ?? a.rwScore ?? a.mathScore ?? `${pct(a.correct ?? 0, a.total ?? 0)}%`}</td>
                </tr>
              ))}
              {attempts.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted">No tests taken yet.</td></tr>}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
