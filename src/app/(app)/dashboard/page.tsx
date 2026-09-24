import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarDays, ClipboardCheck, Languages, Map, Pin, Target, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { liveStreak } from "@/lib/activity";
import { activityCalendar, domainComparison, userTotals } from "@/lib/stats";
import { daysUntil, formatDate, timeAgo } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar, StatTile } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ScoreTrend } from "@/components/charts/score-trend";
import { DomainBars } from "@/components/charts/domain-bars";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { nextUnitFor } from "@/lib/roadmap";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Tashkent" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const user = await requireStudentArea();
  const peers = user.groupId
    ? await db.user.findMany({ where: { groupId: user.groupId, role: "STUDENT" }, select: { id: true, name: true, xp: true } })
    : [];
  const peerIds = peers.map((p) => p.id).filter((id) => id !== user.id);

  const [attempts, domains, calendar, totals, news, nextUnit, peerScores] = await Promise.all([
    db.testAttempt.findMany({
      where: { userId: user.id, status: "COMPLETED", test: { kind: "FULL" } },
      orderBy: { finishedAt: "asc" },
      include: { test: { select: { title: true } } },
    }),
    domainComparison(user.id, peerIds),
    activityCalendar(user.id),
    userTotals(user.id),
    db.newsPost.findMany({ where: visibleTo(user.centerId), orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], take: 3 }),
    nextUnitFor(user),
    db.testAttempt.findMany({
      where: { userId: { in: peers.map((p) => p.id) }, status: "COMPLETED", test: { kind: "FULL" } },
      orderBy: { finishedAt: "desc" },
      select: { userId: true, totalScore: true },
    }),
  ]);

  const latest = attempts.at(-1)?.totalScore ?? null;
  const goal = user.targetScore;
  const days = user.examDate ? daysUntil(user.examDate) : null;
  const uni = user.targetUni;

  // Latest full-test score per group member, for the group standing card.
  const latestByPeer = new globalThis.Map<string, number>();
  for (const a of peerScores) if (!latestByPeer.has(a.userId) && a.totalScore) latestByPeer.set(a.userId, a.totalScore);
  const standing = peers
    .map((p) => ({ ...p, score: latestByPeer.get(p.id) ?? null }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || b.xp - a.xp);
  const rank = standing.findIndex((p) => p.id === user.id) + 1;
  const groupScores = standing.map((p) => p.score).filter((s): s is number => s !== null);
  const groupAvg = groupScores.length ? Math.round(groupScores.reduce((a, b) => a + b, 0) / groupScores.length / 10) * 10 : null;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-brand p-6 text-white shadow-card sm:p-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-50"
          style={{ background: "radial-gradient(50% 80% at 100% 0%, rgb(255 255 255 / .22), transparent 70%), radial-gradient(40% 60% at 0% 100%, rgb(0 0 0 / .2), transparent 70%)" }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/75">{user.center?.name}{user.group ? ` · ${user.group.name}` : ""}</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {greeting()}, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-xl text-white/85">
              {latest && goal
                ? latest >= goal
                  ? `Your latest mock score of ${latest} already meets your goal. Keep it steady.`
                  : `Your latest mock score is ${latest}. ${goal - latest} more points to reach your goal of ${goal}.`
                : "Take your first full-length mock test to see where you stand."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {nextUnit ? (
                <ButtonLink href={`/roadmap/${nextUnit.id}`} className="bg-white text-brand hover:bg-white/90">
                  <Map className="size-4" /> Continue: {nextUnit.title}
                </ButtonLink>
              ) : (
                <ButtonLink href="/roadmap" className="bg-white text-brand hover:bg-white/90">
                  <Map className="size-4" /> Open roadmap
                </ButtonLink>
              )}
              <ButtonLink href="/tests" variant="ghost" className="bg-white/10 text-white hover:bg-white/20 hover:text-white">
                <ClipboardCheck className="size-4" /> Take a mock test
              </ButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Latest score", value: latest ?? "—" },
              { label: "Goal", value: goal ?? "—" },
              { label: days !== null && days >= 0 ? "Days to exam" : "Exam date", value: days !== null && days >= 0 ? days : "—" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm ring-1 ring-white/15">
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
        <StatTile label="Mock tests" value={totals.tests} hint="Completed" icon={<ClipboardCheck className="size-4" />} />
        <StatTile label="Words mastered" value={totals.mastered} hint={`${totals.units} roadmap units done`} icon={<Languages className="size-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ScoreTrend
            goal={goal}
            data={attempts.map((a) => ({
              label: formatDate(a.finishedAt ?? a.startedAt, { year: undefined }),
              title: a.test.title.replace("Full-Length ", ""),
              total: a.totalScore ?? 0,
              rw: a.rwScore ?? 0,
              math: a.mathScore ?? 0,
            }))}
          />
        </div>
        <Card className="flex flex-col">
          <CardHeader title="Dream university" subtitle={uni ? `${uni.city}, ${uni.country}` : "Set a target to compare your score"} />
          <CardBody className="flex flex-1 flex-col">
            {uni ? (
              <>
                <Link href={`/universities/${uni.id}`} className="font-display text-lg font-extrabold text-ink hover:text-brand">
                  {uni.name}
                </Link>
                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-muted">
                    <span>Middle 50% SAT</span>
                    <span className="font-semibold text-ink">
                      {uni.satLow}–{uni.satHigh}
                    </span>
                  </div>
                  <UniRange low={uni.satLow} high={uni.satHigh} score={latest} />
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-surface-2 p-3">
                    <dt className="text-xs text-muted">Acceptance rate</dt>
                    <dd className="font-bold">{uni.acceptanceRate}%</dd>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-3">
                    <dt className="text-xs text-muted">Tuition / year</dt>
                    <dd className="font-bold">${uni.tuition.toLocaleString()}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-muted">{uni.aid}</p>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-start justify-center gap-3">
                <p className="text-sm text-muted">Pick a university to see how your score compares with admitted students.</p>
                <ButtonLink href="/universities" variant="secondary" size="sm">
                  Explore universities <ArrowRight className="size-4" />
                </ButtonLink>
              </div>
            )}
            {user.examDate && (
              <div className="mt-auto flex items-center gap-2 pt-5 text-sm text-ink-2">
                <CalendarDays className="size-4 text-muted" /> Exam on <strong>{formatDate(user.examDate, { weekday: "short" })}</strong>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <DomainBars rows={domains} showGroup={peerIds.length > 0} />
        </div>
        <div className="space-y-6">
          {standing.length > 1 && (
            <Card>
              <CardHeader
                title="Group standing"
                subtitle={`${user.group?.name} · latest mock scores`}
                action={<Trophy className="size-4 text-muted" />}
              />
              <CardBody className="space-y-1">
                <div className="mb-3 flex gap-3 text-sm">
                  <div className="flex-1 rounded-xl bg-surface-2 p-3">
                    <div className="text-xs text-muted">Your rank</div>
                    <div className="font-display text-xl font-extrabold">
                      {rank} <span className="text-sm font-semibold text-muted">/ {standing.length}</span>
                    </div>
                  </div>
                  <div className="flex-1 rounded-xl bg-surface-2 p-3">
                    <div className="text-xs text-muted">Group average</div>
                    <div className="font-display text-xl font-extrabold">{groupAvg ?? "—"}</div>
                  </div>
                </div>
                {standing.slice(0, 5).map((p, i) => (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm ${p.id === user.id ? "bg-brand-soft font-semibold" : ""}`}
                  >
                    <span className="w-4 text-center text-xs font-bold text-muted">{i + 1}</span>
                    <Avatar name={p.name} size={26} />
                    <span className="flex-1 truncate">{p.id === user.id ? "You" : p.name}</span>
                    <span className="font-bold tabular-nums">{p.score ?? "—"}</span>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader
              title="What's new"
              action={
                <Link href="/news" className="text-sm font-semibold text-brand hover:underline">
                  All
                </Link>
              }
            />
            <CardBody className="space-y-4">
              {news.map((n) => (
                <Link key={n.id} href={`/news#${n.id}`} className="block group">
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

function UniRange({ low, high, score }: { low: number; high: number; score: number | null }) {
  const min = 1000;
  const pos = (v: number) => `${((Math.min(1600, Math.max(min, v)) - min) / (1600 - min)) * 100}%`;
  return (
    <div>
      <div className="relative h-2.5 rounded-full bg-surface-3">
        <div className="absolute inset-y-0 rounded-full bg-[color-mix(in_srgb,var(--series-1)_35%,transparent)]" style={{ left: pos(low), right: `calc(100% - ${pos(high)})` }} />
        {score && (
          <div className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-series-1" style={{ left: pos(score) }} title={`Your latest score: ${score}`} />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-muted tabular-nums">
        <span>1000</span>
        {score && <span className="font-semibold text-ink">You: {score}</span>}
        <span>1600</span>
      </div>
    </div>
  );
}
