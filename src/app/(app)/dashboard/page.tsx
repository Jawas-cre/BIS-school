import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarDays, ClipboardCheck, Clock, Languages, Map, Pin, Target, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { liveStreak } from "@/lib/activity";
import { activityCalendar, subjectComparison, userTotals } from "@/lib/stats";
import { roadmapOverview } from "@/lib/roadmap";
import { enrolledSubjectIds, visibleSubjects } from "@/lib/subjects";
import { daysUntil, formatDate, pct, timeAgo } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Progress, StatTile } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { SubjectIcon } from "@/components/subject-icon";
import { ScoreTrend } from "@/components/charts/score-trend";
import { SubjectBars } from "@/components/charts/subject-bars";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tashkent" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const user = await requireStudentArea();
  const subjects = await visibleSubjects(user.centerId);
  const enrolled = enrolledSubjectIds(user);
  // Subjects shown on the dashboard: the student's groups, or every subject if they have none yet.
  const mySubjects = enrolled.length ? subjects.filter((s) => enrolled.includes(s.id)) : subjects;
  const groupIds = user.memberships.map((m) => m.groupId);
  const peers = groupIds.length
    ? await db.groupMember.findMany({ where: { groupId: { in: groupIds }, userId: { not: user.id } }, select: { userId: true }, distinct: ["userId"] })
    : [];

  const [attempts, comparison, calendar, totals, news, overview] = await Promise.all([
    db.testAttempt.findMany({
      where: { userId: user.id, status: "COMPLETED" },
      orderBy: { finishedAt: "asc" },
      include: { test: { select: { title: true, subject: { select: { name: true } } } } },
    }),
    subjectComparison(user.id, peers.map((p) => p.userId), mySubjects),
    activityCalendar(user.id),
    userTotals(user.id),
    db.newsPost.findMany({ where: visibleTo(user.centerId), orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 3 }),
    roadmapOverview(user, mySubjects.map((s) => s.id)),
  ]);

  const days = user.examDate ? daysUntil(user.examDate) : null;
  const uni = user.targetUni;
  const next = overview.find((o) => o.next);
  const nextSubject = next ? subjects.find((s) => s.id === next.subjectId) : null;
  const latest = attempts.at(-1);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-brand p-6 text-white shadow-card sm:p-8">
        <div aria-hidden className="absolute inset-0 opacity-50" style={{ background: "radial-gradient(50% 80% at 100% 0%, rgb(255 255 255 / .22), transparent 70%), radial-gradient(40% 60% at 0% 100%, rgb(0 0 0 / .2), transparent 70%)" }} />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/75">
              {user.center?.name}
              {user.grade ? ` · ${user.grade}` : ""}
            </p>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {greeting()}, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-xl text-white/85">
              {latest
                ? `Your last test — ${latest.test.title} — scored ${latest.score}%. ${user.goal ? `Keep going: ${user.goal}.` : "Keep up the momentum."}`
                : user.goal
                  ? `Your goal: ${user.goal}. Start with the roadmap or a practice test.`
                  : "Start with the roadmap or take a practice test to see where you stand."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {next?.next && nextSubject ? (
                <ButtonLink href={`/roadmap/${next.next.id}`} className="bg-white text-brand hover:bg-white/90">
                  <Map className="size-4" /> Continue {nextSubject.name}: {next.next.title}
                </ButtonLink>
              ) : (
                <ButtonLink href="/roadmap" className="bg-white text-brand hover:bg-white/90">
                  <Map className="size-4" /> Open roadmap
                </ButtonLink>
              )}
              <ButtonLink href="/tests" variant="ghost" className="bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <ClipboardCheck className="size-4" /> Take a test
              </ButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Average test", value: totals.avgTestScore !== null ? `${totals.avgTestScore}%` : "—" },
              { label: "Streak", value: `${liveStreak(user)}d` },
              { label: days !== null && days >= 0 ? "Days to exam" : "Tests taken", value: days !== null && days >= 0 ? days : totals.tests },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/12 px-4 py-3 ring-1 ring-white/15 backdrop-blur-sm">
                <div className="text-[11px] font-semibold text-white/70">{s.label}</div>
                <div className="font-display text-2xl font-extrabold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Questions answered" value={totals.answered.toLocaleString()} hint={`${totals.distinct} unique questions`} icon={<BookOpenCheck className="size-4" />} />
        <StatTile label="Accuracy" value={totals.answered ? `${totals.accuracy}%` : "—"} hint="Across all practice" icon={<Target className="size-4" />} />
        <StatTile label="Tests completed" value={totals.tests} hint={totals.avgTestScore !== null ? `Average ${totals.avgTestScore}%` : "No tests yet"} icon={<ClipboardCheck className="size-4" />} />
        <StatTile label="Words mastered" value={totals.mastered} hint={`${totals.units} roadmap units done`} icon={<Languages className="size-4" />} />
      </div>

      {/* Subjects */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{enrolled.length ? "My subjects" : "Subjects"}</h2>
          <Link href="/roadmap" className="text-sm font-semibold text-brand hover:underline">Roadmap</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {mySubjects.map((s) => {
            const o = overview.find((x) => x.subjectId === s.id);
            const c = comparison.find((x) => x.id === s.id);
            const group = user.memberships.find((m) => m.group.subjectId === s.id)?.group;
            return (
              <Link key={s.id} href={`/roadmap?subject=${s.id}`} className="group rounded-2xl border border-line bg-surface p-4 shadow-card hover:border-line-strong">
                <div className="flex items-center gap-3">
                  <SubjectIcon icon={s.icon} color={s.color} />
                  <div className="min-w-0 flex-1">
                    <div className="font-display font-bold group-hover:text-brand">{s.name}</div>
                    <div className="truncate text-xs text-muted">{group ? `${group.name}${group.schedule ? ` · ${group.schedule}` : ""}` : s.description}</div>
                  </div>
                  {c?.you !== null && c?.you !== undefined && <Badge tone={c.you >= 75 ? "success" : c.you >= 55 ? "warning" : "danger"}>{c.you}%</Badge>}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted">
                  <span>Roadmap {o?.done ?? 0}/{o?.total ?? 0}</span>
                  <span className="truncate pl-2">{o?.next ? `Next: ${o.next.title}` : o?.total ? "Complete 🎉" : ""}</span>
                </div>
                <Progress value={pct(o?.done ?? 0, o?.total ?? 0)} className="mt-1.5" />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ScoreTrend
            data={attempts.map((a) => ({
              label: formatDate(a.finishedAt ?? a.startedAt, { year: undefined }),
              title: a.test.title,
              subject: a.test.subject?.name ?? "Mixed",
              score: a.score ?? 0,
            }))}
          />
        </div>
        <Card className="flex flex-col">
          {user.memberships.length > 0 ? (
            <>
              <CardHeader title="My groups" action={<Users className="size-4 text-muted" />} />
              <CardBody className="space-y-3">
                {user.memberships.map((m) => (
                  <div key={m.groupId} className="rounded-xl border border-line p-3">
                    <div className="flex items-center gap-2">
                      {m.group.subject && <span className="size-2 rounded-full" style={{ background: m.group.subject.color }} />}
                      <span className="font-semibold">{m.group.name}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      {m.group.schedule && <span className="flex items-center gap-1"><Clock className="size-3" /> {m.group.schedule}</span>}
                      {m.group.teacher && <span>Teacher: {m.group.teacher.name}</span>}
                    </div>
                  </div>
                ))}
              </CardBody>
            </>
          ) : (
            <>
              <CardHeader title="Join a group" />
              <CardBody className="text-sm text-muted">Your teacher will add you to a group for each subject you study. Until then you can practise every subject.</CardBody>
            </>
          )}
          {user.examDate && (
            <div className="mt-auto flex items-center gap-2 border-t border-line px-5 py-4 text-sm text-ink-2">
              <CalendarDays className="size-4 text-muted" /> Exam on <strong>{formatDate(user.examDate, { weekday: "short" })}</strong>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SubjectBars rows={comparison} showGroup={peers.length > 0} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Dream university" subtitle={uni ? `${uni.city}, ${uni.country}` : "Set a target to stay motivated"} />
            <CardBody>
              {uni ? (
                <>
                  <Link href={`/universities/${uni.id}`} className="font-display text-lg font-extrabold text-ink hover:text-brand">{uni.name}</Link>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{uni.requirements}</p>
                </>
              ) : (
                <ButtonLink href="/universities" variant="secondary" size="sm">
                  Explore universities <ArrowRight className="size-4" />
                </ButtonLink>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="What's new" action={<Link href="/news" className="text-sm font-semibold text-brand hover:underline">All</Link>} />
            <CardBody className="space-y-4">
              {news.map((n) => (
                <Link key={n.id} href={`/news#${n.id}`} className="group block">
                  <div className="flex items-center gap-2">
                    {n.pinned && <Pin className="size-3.5 text-brand" />}
                    <Badge tone={n.centerId ? "brand" : "neutral"}>{n.tag}</Badge>
                    <span className="text-xs text-muted">{timeAgo(n.createdAt)}</span>
                  </div>
                  <div className="mt-1 font-semibold text-ink group-hover:text-brand">{n.title}</div>
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>

      <ActivityHeatmap days={calendar} streak={liveStreak(user)} best={user.bestStreak} />
    </div>
  );
}
