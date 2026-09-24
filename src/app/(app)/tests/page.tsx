import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookText, Calculator, Clock, FileText, PlayCircle, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatDate, pct } from "@/lib/utils";

export const metadata: Metadata = { title: "Mock Tests" };

export default async function TestsPage() {
  const user = await requireStudentArea();
  const [tests, attempts] = await Promise.all([
    db.test.findMany({
      where: { published: true, ...visibleTo(user.centerId) },
      orderBy: [{ kind: "asc" }, { title: "asc" }],
      include: { modules: { select: { minutes: true, section: true, _count: { select: { questions: true } } } } },
    }),
    db.testAttempt.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      include: { test: { select: { title: true, kind: true } } },
    }),
  ]);

  const best = new Map<string, { score: number | null; percent: number; count: number }>();
  for (const a of attempts.filter((a) => a.status === "COMPLETED")) {
    const prev = best.get(a.testId);
    const percent = pct(a.correct ?? 0, a.total ?? 0);
    const score = a.totalScore ?? a.rwScore ?? a.mathScore;
    best.set(a.testId, {
      score: Math.max(score ?? 0, prev?.score ?? 0) || null,
      percent: Math.max(percent, prev?.percent ?? 0),
      count: (prev?.count ?? 0) + 1,
    });
  }
  const open = attempts.filter((a) => a.status !== "COMPLETED");
  const completed = attempts.filter((a) => a.status === "COMPLETED");
  const info = (t: (typeof tests)[number]) => ({
    minutes: t.modules.reduce((s, m) => s + m.minutes, 0),
    questions: t.modules.reduce((s, m) => s + m._count.questions, 0),
  });
  const full = tests.filter((t) => t.kind === "FULL");
  const sections = tests.filter((t) => t.kind === "SECTION");
  const topics = tests.filter((t) => t.kind === "TOPIC");

  return (
    <div className="space-y-10">
      <PageHeader
        title="Mock Tests"
        subtitle="Timed practice in the same format as the Digital SAT — adaptive-style modules, the official timing, a reference sheet and an instant score report."
      />

      {open.length > 0 && (
        <div className="space-y-2">
          {open.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand bg-brand-soft p-4">
              <PlayCircle className="size-6 text-brand" />
              <div className="flex-1">
                <div className="font-bold text-ink">{a.test.title} is in progress</div>
                <div className="text-sm text-ink-2">Started {formatDate(a.startedAt, { hour: "numeric", minute: "2-digit" })}</div>
              </div>
              <ButtonLink href={`/tests/attempt/${a.id}`}>Resume</ButtonLink>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-4 font-display text-lg font-bold">Full-length practice tests</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {full.map((t) => {
            const b = best.get(t.id);
            const { minutes, questions } = info(t);
            return (
              <div key={t.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                    <FileText className="size-5" />
                  </div>
                  {b?.score && (
                    <div className="text-right">
                      <div className="text-xs text-muted">Best score</div>
                      <div className="font-display text-2xl font-extrabold text-ink">{b.score}</div>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 font-display text-lg font-bold">{t.title}</h3>
                <p className="mt-1 text-sm text-muted">{t.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Badge><Clock className="size-3" /> {Math.floor(minutes / 60)}h {minutes % 60}m + break</Badge>
                  <Badge>{questions} questions</Badge>
                  <Badge>4 modules</Badge>
                  {b && <Badge tone="success">Taken {b.count}×</Badge>}
                </div>
                <div className="mt-5 flex gap-2 pt-1">
                  <ButtonLink href={`/tests/${t.id}`} className="flex-1">
                    {b ? "Retake test" : "Start test"}
                  </ButtonLink>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg font-bold">Section tests</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((t) => {
            const b = best.get(t.id);
            const { minutes, questions } = info(t);
            const Icon = t.section === "MATH" ? Calculator : BookText;
            return (
              <Link key={t.id} href={`/tests/${t.id}`} className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card hover:border-line-strong">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-2">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-ink group-hover:text-brand">{t.title}</div>
                  <div className="text-sm text-muted">
                    {questions} questions · {minutes} min{b?.score ? ` · best ${b.score}` : ""}
                  </div>
                </div>
                <ArrowRight className="size-5 text-muted group-hover:text-brand" />
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-1 font-display text-lg font-bold">Topic tests</h2>
        <p className="mb-4 text-sm text-muted">Short timed tests on a single skill — ideal after finishing a roadmap unit.</p>
        {(["RW", "MATH"] as const).map((section) => (
          <div key={section} className="mb-6">
            <div className="mb-2 text-[11px] font-bold tracking-wider text-muted uppercase">{section === "RW" ? "Reading & Writing" : "Math"}</div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {topics
                .filter((t) => t.section === section)
                .map((t) => {
                  const b = best.get(t.id);
                  const { minutes, questions } = info(t);
                  return (
                    <Link key={t.id} href={`/tests/${t.id}`} className="group rounded-xl border border-line bg-surface p-4 hover:border-line-strong">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-ink group-hover:text-brand">{t.title}</span>
                        {b && <Badge tone={b.percent >= 80 ? "success" : b.percent >= 60 ? "warning" : "danger"}>{b.percent}%</Badge>}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {questions} questions · {minutes} min
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </section>

      {completed.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
            <Trophy className="size-5 text-muted" /> Your results
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-3 font-semibold">Test</th>
                  <th className="px-3 py-3 font-semibold">Date</th>
                  <th className="px-3 py-3 text-right font-semibold">Correct</th>
                  <th className="px-3 py-3 text-right font-semibold">Score</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {completed.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 font-semibold">{a.test.title}</td>
                    <td className="px-3 py-3 text-muted">{formatDate(a.finishedAt ?? a.startedAt)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {a.correct}/{a.total}
                    </td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">
                      {a.totalScore ?? a.rwScore ?? a.mathScore ?? `${pct(a.correct ?? 0, a.total ?? 0)}%`}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/tests/attempt/${a.id}/results`} className="font-semibold text-brand hover:underline">
                        Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
