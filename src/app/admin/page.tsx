import type { Metadata } from "next";
import Link from "next/link";
import { Activity, AlertTriangle, ClipboardCheck, KeyRound, Target, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { average, centerStudents } from "@/lib/admin";
import { PageHeader, StatTile, Avatar } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/copy-button";
import { ScoreBands } from "@/components/charts/score-bands";
import { formatDate, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverview({ searchParams }: PageProps<"/admin">) {
  const staff = await requireStaff();
  const { welcome } = await searchParams;
  const [students, groups, recent] = await Promise.all([
    centerStudents(staff.centerId),
    db.group.findMany({ where: { centerId: staff.centerId }, include: { teacher: { select: { name: true } }, branch: { select: { name: true } }, subject: { select: { name: true, color: true } } }, orderBy: { name: "asc" } }),
    db.testAttempt.findMany({
      where: { status: "COMPLETED", user: { centerId: staff.centerId } },
      orderBy: { finishedAt: "desc" },
      take: 8,
      include: { user: { select: { id: true, name: true } }, test: { select: { title: true, subject: { select: { name: true } } } } },
    }),
  ]);
  const activeWeek = students.filter((s) => s.weekQuestions > 0).length;
  const attention = students.filter((s) => s.weekQuestions === 0 || (s.accuracy !== null && s.accuracy < 55)).slice(0, 6);
  const center = staff.center!;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={center.name} title={welcome ? "Your center is ready 🎉" : "Overview"} subtitle="How your students are doing this week." />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-brand-soft p-5 sm:flex-row sm:items-center">
          <div className="grid size-11 place-items-center rounded-xl bg-brand text-white">
            <KeyRound className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold">Invite students</div>
            <p className="text-sm text-ink-2">
              Students sign up at <strong>/register</strong> with your code, or share the direct link. You can also add accounts yourself on the Students page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-line bg-surface px-4 py-2 font-mono text-lg font-bold tracking-[0.3em]">{center.inviteCode}</span>
            <CopyButton text={center.inviteCode} label="Copy code" />
            <CopyButton text={`/register?code=${center.inviteCode}`} absolute label="Copy link" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Students" value={students.length} hint={`${groups.length} groups`} icon={<Users className="size-4" />} />
        <StatTile label="Active this week" value={activeWeek} hint={`${students.length ? Math.round((activeWeek / students.length) * 100) : 0}% of students`} icon={<Activity className="size-4" />} />
        <StatTile label="Average test score" value={average(students.map((s) => s.avgTest)) !== null ? `${average(students.map((s) => s.avgTest))}%` : "—"} hint="All completed tests" icon={<Target className="size-4" />} />
        <StatTile label="Average accuracy" value={`${average(students.map((s) => s.accuracy)) ?? 0}%`} hint="All practice" icon={<ClipboardCheck className="size-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ScoreBands scores={students.map((s) => s.avgTest).filter((s): s is number => s !== null)} />
        </div>
        <Card>
          <CardHeader title="Needs attention" subtitle="No practice this week or accuracy under 55%" action={<AlertTriangle className="size-4 text-warning" />} />
          <CardBody className="space-y-1">
            {attention.length === 0 && <p className="text-sm text-muted">Everyone is on track. 🎯</p>}
            {attention.map((s) => (
              <Link key={s.id} href={`/admin/students/${s.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                <Avatar name={s.name} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{s.name}</span>
                  <span className="block truncate text-xs text-muted">{s.groups.map((g) => g.name).join(", ") || "No group"}</span>
                </span>
                {s.weekQuestions === 0 ? <Badge tone="warning">Inactive</Badge> : <Badge tone="danger">{s.accuracy}%</Badge>}
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Groups" action={<Link href="/admin/groups" className="text-sm font-semibold text-brand hover:underline">Manage</Link>} />
          <CardBody className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-semibold">Group</th>
                  <th className="py-2 pr-3 font-semibold">Teacher</th>
                  <th className="py-2 pr-3 text-right font-semibold">Students</th>
                  <th className="py-2 pr-3 text-right font-semibold">Avg score</th>
                  <th className="py-2 text-right font-semibold">Active</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => {
                  const members = students.filter((s) => s.groups.some((x) => x.id === g.id));
                  return (
                    <tr key={g.id} className="border-b border-line last:border-0">
                      <td className="py-2.5 pr-3">
                        <Link href={`/admin/groups/${g.id}`} className="font-semibold hover:text-brand">{g.name}</Link>
                        <div className="flex items-center gap-1.5 text-xs text-muted">
                          {g.subject && <span className="size-1.5 rounded-full" style={{ background: g.subject.color }} />}
                          {[g.subject?.name, g.branch?.name, g.schedule].filter(Boolean).join(" · ")}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-ink-2">{g.teacher?.name ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-right tabular-nums">{members.length}</td>
                      <td className="py-2.5 pr-3 text-right font-semibold tabular-nums">{average(members.map((m) => m.avgTest)) !== null ? `${average(members.map((m) => m.avgTest))}%` : "—"}</td>
                      <td className="py-2.5 text-right tabular-nums">{members.filter((m) => m.weekQuestions > 0).length}/{members.length}</td>
                    </tr>
                  );
                })}
                {groups.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-muted">No groups yet — create one on the Groups page.</td></tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Latest test results" />
          <CardBody className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-muted">No tests taken yet.</p>}
            {recent.map((a) => (
              <Link key={a.id} href={`/admin/students/${a.user.id}`} className="flex items-center gap-3 rounded-lg hover:bg-surface-2">
                <Avatar name={a.user.name} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{a.user.name}</span>
                  <span className="block truncate text-xs text-muted" title={a.finishedAt ? formatDate(a.finishedAt) : ""}>
                    {a.test.subject?.name ? `${a.test.subject.name} · ` : ""}{a.test.title} · {a.finishedAt ? timeAgo(a.finishedAt) : ""}
                  </span>
                </span>
                <span className="font-bold tabular-nums">{a.score}%</span>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
