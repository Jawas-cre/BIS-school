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
import { fmt, plural, rich } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.overview.title);

export default async function AdminOverview({ searchParams }: PageProps<"/admin">) {
  const staff = await requireStaff();
  const { welcome } = await searchParams;
  const { t, date, ago } = await getI18n();
  const O = t.overview;
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
      <PageHeader eyebrow={center.name} title={welcome ? O.ready : O.heading} subtitle={O.subtitle} />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 bg-brand-soft p-5 sm:flex-row sm:items-center">
          <div className="grid size-11 place-items-center rounded-xl bg-brand text-white">
            <KeyRound className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold">{O.inviteTitle}</div>
            <p className="text-sm text-ink-2">{rich(O.inviteText, { register: <strong>/register</strong> })}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border border-line bg-surface px-4 py-2 font-mono text-lg font-bold tracking-[0.3em]">{center.inviteCode}</span>
            <CopyButton text={center.inviteCode} label={O.copyCode} />
            <CopyButton text={`/register?code=${center.inviteCode}`} absolute label={O.copyLink} />
            {staff.role === "CENTER_ADMIN" && (
              <Link href="/admin/codes" className="inline-flex h-10 items-center rounded-xl bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-strong">
                {t.codes.manage}
              </Link>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={O.statStudents} value={students.length} hint={plural(t.common.groups, groups.length)} icon={<Users className="size-4" />} />
        <StatTile label={O.activeWeek} value={activeWeek} hint={fmt(O.activePct, { pct: students.length ? Math.round((activeWeek / students.length) * 100) : 0 })} icon={<Activity className="size-4" />} />
        <StatTile label={O.avgTestScore} value={average(students.map((s) => s.avgTest)) !== null ? `${average(students.map((s) => s.avgTest))}%` : "—"} hint={O.allCompletedTests} icon={<Target className="size-4" />} />
        <StatTile label={O.avgAccuracy} value={`${average(students.map((s) => s.accuracy)) ?? 0}%`} hint={O.allPractice} icon={<ClipboardCheck className="size-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ScoreBands scores={students.map((s) => s.avgTest).filter((s): s is number => s !== null)} />
        </div>
        <Card>
          <CardHeader title={O.needsAttention} subtitle={O.needsAttentionSub} action={<AlertTriangle className="size-4 text-warning" />} />
          <CardBody className="space-y-1">
            {attention.length === 0 && <p className="text-sm text-muted">{O.onTrack}</p>}
            {attention.map((s) => (
              <Link key={s.id} href={`/admin/students/${s.id}`} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-surface-2">
                <Avatar name={s.name} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{s.name}</span>
                  <span className="block truncate text-xs text-muted">{s.groups.map((g) => g.name).join(", ") || O.noGroup}</span>
                </span>
                {s.weekQuestions === 0 ? <Badge tone="warning">{O.inactive}</Badge> : <Badge tone="danger">{s.accuracy}%</Badge>}
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title={O.groups} action={<Link href="/admin/groups" className="text-sm font-semibold text-brand hover:underline">{O.manage}</Link>} />
          <CardBody className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-semibold">{O.colGroup}</th>
                  <th className="py-2 pr-3 font-semibold">{O.colTeacher}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{O.colStudents}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{O.colAvgScore}</th>
                  <th className="py-2 text-right font-semibold">{O.colActive}</th>
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
                  <tr><td colSpan={5} className="py-6 text-center text-muted">{O.noGroups}</td></tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={O.latestResults} />
          <CardBody className="space-y-3">
            {recent.length === 0 && <p className="text-sm text-muted">{O.noTests}</p>}
            {recent.map((a) => (
              <Link key={a.id} href={`/admin/students/${a.user.id}`} className="flex items-center gap-3 rounded-lg hover:bg-surface-2">
                <Avatar name={a.user.name} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{a.user.name}</span>
                  <span className="block truncate text-xs text-muted" title={a.finishedAt ? date(a.finishedAt) : ""}>
                    {a.test.subject?.name ? `${a.test.subject.name} · ` : ""}{a.test.title} · {a.finishedAt ? ago(a.finishedAt) : ""}
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
