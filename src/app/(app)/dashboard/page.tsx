import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarCheck, CalendarDays, ClipboardCheck, ClipboardList, Clock, Languages, Map, Pin, Target, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { liveStreak } from "@/lib/activity";
import { activityCalendar, subjectComparison, userTotals } from "@/lib/stats";
import { roadmapOverview } from "@/lib/roadmap";
import { enrolledSubjectIds, visibleSubjects } from "@/lib/subjects";
import { daysUntil, pct } from "@/lib/utils";
import { fmt, rich } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";
import type { Dict } from "@/lib/i18n/dictionaries";
import { countryName, newsTag } from "@/lib/i18n/labels";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Progress, StatTile } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { SubjectIcon } from "@/components/subject-icon";
import { ScoreTrend } from "@/components/charts/score-trend";
import { SubjectBars } from "@/components/charts/subject-bars";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { studentAssignments } from "@/lib/assignments";
import { attended, studentJournal } from "@/lib/journal";
import { masteryPercent, topicMastery } from "@/lib/mastery";
import { AssignmentItem } from "@/components/assignment-item";

export const generateMetadata = pageTitle((t) => t.nav.dashboard);

function greeting(t: Dict) {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tashkent" }).format(new Date()));
  return hour < 12 ? t.dashboard.morning : hour < 18 ? t.dashboard.afternoon : t.dashboard.evening;
}

export default async function DashboardPage() {
  const user = await requireStudentArea();
  const { t, num, date, ago } = await getI18n();
  const D = t.dashboard;
  const subjects = await visibleSubjects(user.centerId);
  const enrolled = enrolledSubjectIds(user);
  // Subjects shown on the dashboard: the student's groups, or every subject if they have none yet.
  const mySubjects = enrolled.length ? subjects.filter((s) => enrolled.includes(s.id)) : subjects;
  const groupIds = user.memberships.map((m) => m.groupId);
  const peers = groupIds.length
    ? await db.groupMember.findMany({ where: { groupId: { in: groupIds }, userId: { not: user.id } }, select: { userId: true }, distinct: ["userId"] })
    : [];

  const [attempts, comparison, calendar, totals, news, overview, assignments, journal, mastery] = await Promise.all([
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
    studentAssignments(user.id, groupIds),
    studentJournal(user.id, 200),
    topicMastery([user.id], mySubjects.flatMap((s) => s.topics.map((x) => x.id))).then((m) => m.get(user.id)),
  ]);
  const dueSoon = assignments.filter((a) => a.state !== "done").sort((x, y) => (x.state === y.state ? x.dueOn.localeCompare(y.dueOn) : x.state === "overdue" ? -1 : 1));
  const counted = journal.filter((e) => e.status !== "EXCUSED");
  const attendanceRate = counted.length ? Math.round((counted.filter((e) => attended(e.status)).length / counted.length) * 100) : null;
  const grades = journal.map((e) => e.grade).filter((g): g is number => g !== null);
  const avgGrade = grades.length ? Math.round((grades.reduce((a, b) => a + b, 0) / grades.length) * 10) / 10 : null;

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
              {fmt(D.greeting, { greeting: greeting(t), name: user.name.split(" ")[0] })}
            </h1>
            <p className="mt-2 max-w-xl text-white/85">
              {latest
                ? `${fmt(D.lastTest, { title: latest.test.title, score: latest.score ?? 0 })} ${user.goal ? fmt(D.keepGoingGoal, { goal: user.goal }) : D.keepMomentum}`
                : user.goal
                  ? fmt(D.yourGoal, { goal: user.goal })
                  : D.startHint}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {next?.next && nextSubject ? (
                <ButtonLink href={`/roadmap/${next.next.id}`} className="max-w-full bg-white text-brand hover:bg-white/90">
                  <Map className="size-4 shrink-0" /> <span className="truncate">{fmt(D.continueSubject, { subject: nextSubject.name, unit: next.next.title })}</span>
                </ButtonLink>
              ) : (
                <ButtonLink href="/roadmap" className="bg-white text-brand hover:bg-white/90">
                  <Map className="size-4" /> {D.openRoadmap}
                </ButtonLink>
              )}
              <ButtonLink href="/tests" variant="ghost" className="bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <ClipboardCheck className="size-4" /> {D.takeTest}
              </ButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: D.avgTest, value: totals.avgTestScore !== null ? `${totals.avgTestScore}%` : "—" },
              { label: D.streak, value: fmt(D.streakDays, { n: liveStreak(user) }) },
              { label: days !== null && days >= 0 ? D.daysToExam : D.testsTaken, value: days !== null && days >= 0 ? days : totals.tests },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/12 px-3 py-3 ring-1 ring-white/15 backdrop-blur-sm sm:px-4">
                <div className="text-[11px] font-semibold text-white/70">{s.label}</div>
                <div className="font-display text-xl font-extrabold whitespace-nowrap sm:text-2xl">{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={D.questionsAnswered} value={num(totals.answered)} hint={fmt(D.uniqueQuestions, { n: totals.distinct })} icon={<BookOpenCheck className="size-4" />} />
        <StatTile label={D.accuracy} value={totals.answered ? `${totals.accuracy}%` : "—"} hint={D.acrossPractice} icon={<Target className="size-4" />} />
        <StatTile label={D.testsCompleted} value={totals.tests} hint={totals.avgTestScore !== null ? fmt(D.average, { pct: totals.avgTestScore }) : D.noTestsYet} icon={<ClipboardCheck className="size-4" />} />
        <StatTile label={D.wordsMastered} value={totals.mastered} hint={fmt(D.unitsDone, { n: totals.units })} icon={<Languages className="size-4" />} />
      </div>

      {groupIds.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader
              title={t.assignments.dueSoon}
              action={<Link href="/assignments" className="text-sm font-semibold text-brand hover:underline">{t.assignments.seeAll}</Link>}
            />
            <CardBody className="space-y-2">
              {dueSoon.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-muted"><ClipboardList className="size-4" /> {t.assignments.noneStudent}</p>
              ) : (
                dueSoon.slice(0, 3).map((a) => <AssignmentItem key={a.id} a={a} t={t} date={date} compact />)
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t.journal.cardTitle} action={<Link href="/journal" className="text-sm font-semibold text-brand hover:underline">{t.nav.journal}</Link>} />
            <CardBody className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-2 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted"><CalendarCheck className="size-3.5" /> {t.journal.attendance}</div>
                  <div className="font-display text-2xl font-extrabold">{attendanceRate === null ? "—" : `${attendanceRate}%`}</div>
                </div>
                <div className="rounded-xl bg-surface-2 p-3">
                  <div className="text-xs font-semibold text-muted">{t.journal.avgGrade}</div>
                  <div className="font-display text-2xl font-extrabold">{avgGrade ?? "—"}</div>
                </div>
              </div>
              {journal.slice(0, 3).map((e) => (
                <div key={e.lessonId} className="flex items-center justify-between gap-2 text-sm">
                  <span className="min-w-0 truncate text-ink-2">{date(e.lesson.day, { year: undefined })} · {e.lesson.group.name}</span>
                  <span className="shrink-0 font-semibold">{t.journal.status[e.status as keyof typeof t.journal.status]}{e.grade ? ` · ${e.grade}` : ""}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Subjects */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{enrolled.length ? D.mySubjects : D.subjects}</h2>
          <Link href="/roadmap" className="text-sm font-semibold text-brand hover:underline">{t.nav.roadmap}</Link>
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
                  <span>
                    {fmt(D.roadmapProgress, { done: o?.done ?? 0, total: o?.total ?? 0 })} · {fmt(t.mastery.subjectMastery, { pct: masteryPercent(mastery, s.topics.map((x) => x.id)) })}
                  </span>
                  <span className="truncate pl-2">{o?.next ? fmt(D.nextUnit, { title: o.next.title }) : o?.total ? D.complete : ""}</span>
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
              label: date(a.finishedAt ?? a.startedAt, { year: undefined }),
              title: a.test.title,
              subject: a.test.subject?.name ?? t.common.mixed,
              score: a.score ?? 0,
            }))}
          />
        </div>
        <Card className="flex flex-col">
          {user.memberships.length > 0 ? (
            <>
              <CardHeader title={D.myGroups} action={<Users className="size-4 text-muted" />} />
              <CardBody className="space-y-3">
                {user.memberships.map((m) => (
                  <div key={m.groupId} className="rounded-xl border border-line p-3">
                    <div className="flex items-center gap-2">
                      {m.group.subject && <span className="size-2 rounded-full" style={{ background: m.group.subject.color }} />}
                      <span className="font-semibold">{m.group.name}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                      {m.group.schedule && <span className="flex items-center gap-1"><Clock className="size-3" /> {m.group.schedule}</span>}
                      {m.group.teacher && <span>{fmt(D.teacher, { name: m.group.teacher.name })}</span>}
                    </div>
                  </div>
                ))}
              </CardBody>
            </>
          ) : (
            <>
              <CardHeader title={D.joinGroup} />
              <CardBody className="text-sm text-muted">{D.joinGroupText}</CardBody>
            </>
          )}
          {user.examDate && (
            <div className="mt-auto flex items-center gap-2 border-t border-line px-5 py-4 text-sm text-ink-2">
              <CalendarDays className="size-4 text-muted" /> {rich(D.examOn, { date: <strong>{date(user.examDate, { weekday: "short" })}</strong> })}
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
            <CardHeader title={D.dreamUni} subtitle={uni ? `${uni.city}, ${countryName(t, uni.country)}` : D.setTarget} />
            <CardBody>
              {uni ? (
                <>
                  <Link href={`/universities/${uni.id}`} className="font-display text-lg font-extrabold text-ink hover:text-brand">{uni.name}</Link>
                  <p className="mt-2 line-clamp-3 text-sm text-muted">{uni.requirements}</p>
                </>
              ) : (
                <ButtonLink href="/universities" variant="secondary" size="sm">
                  {D.exploreUnis} <ArrowRight className="size-4" />
                </ButtonLink>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t.nav.news} action={<Link href="/news" className="text-sm font-semibold text-brand hover:underline">{t.common.all}</Link>} />
            <CardBody className="space-y-4">
              {news.map((n) => (
                <Link key={n.id} href={`/news#${n.id}`} className="group block">
                  <div className="flex items-center gap-2">
                    {n.pinned && <Pin className="size-3.5 text-brand" />}
                    <Badge tone={n.centerId ? "brand" : "neutral"}>{newsTag(t, n.tag)}</Badge>
                    <span className="text-xs text-muted">{ago(n.createdAt)}</span>
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
