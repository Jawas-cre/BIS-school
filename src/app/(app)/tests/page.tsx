import Link from "next/link";
import { Clock, FileText, Layers, PlayCircle, Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { enrolledSubjectIds, visibleSubjects } from "@/lib/subjects";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SubjectBadge, SubjectIcon } from "@/components/subject-icon";
import { cn } from "@/lib/utils";
import { fmt, plural } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.tests);

export default async function TestsPage({ searchParams }: PageProps<"/tests">) {
  const user = await requireStudentArea();
  const sp = await searchParams;
  const { t, date } = await getI18n();
  const T = t.tests;
  const subjects = await visibleSubjects(user.centerId);
  const enrolled = enrolledSubjectIds(user);
  const filter = typeof sp.subject === "string" ? sp.subject : "";
  const [tests, attempts] = await Promise.all([
    db.test.findMany({
      where: { published: true, ...visibleTo(user.centerId), ...(filter ? { subjectId: filter } : {}) },
      orderBy: [{ kind: "asc" }, { title: "asc" }],
      include: { subject: true, modules: { select: { minutes: true, title: true, _count: { select: { questions: true } } }, orderBy: { order: "asc" } } },
    }),
    db.testAttempt.findMany({ where: { userId: user.id }, orderBy: { startedAt: "desc" }, include: { test: { select: { title: true, subject: { select: { name: true, color: true } } } } } }),
  ]);

  const best = new Map<string, { score: number; count: number }>();
  for (const a of attempts.filter((a) => a.status === "COMPLETED")) {
    const prev = best.get(a.testId);
    best.set(a.testId, { score: Math.max(a.score ?? 0, prev?.score ?? 0), count: (prev?.count ?? 0) + 1 });
  }
  const open = attempts.filter((a) => a.status !== "COMPLETED");
  const completed = attempts.filter((a) => a.status === "COMPLETED");
  const info = (test: (typeof tests)[number]) => ({
    minutes: test.modules.reduce((s, m) => s + m.minutes, 0),
    questions: test.modules.reduce((s, m) => s + m._count.questions, 0),
  });
  const exams = tests.filter((test) => test.kind !== "TOPIC");
  const topics = tests.filter((test) => test.kind === "TOPIC");
  const ordered = [...subjects].sort((a, b) => Number(enrolled.includes(b.id)) - Number(enrolled.includes(a.id)));

  return (
    <div className="space-y-10">
      <PageHeader title={t.nav.tests} subtitle={T.subtitle} />

      <div className="-mt-4 flex gap-2 overflow-x-auto pb-1">
        <Link href="/tests" className={cn("shrink-0 rounded-xl border px-3 py-1.5 text-sm font-semibold", !filter ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-2")}>
          {t.bank.allSubjects}
        </Link>
        {ordered.map((s) => (
          <Link key={s.id} href={`/tests?subject=${s.id}`} className={cn("flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold", filter === s.id ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-2")}>
            <span className="size-2 rounded-full" style={{ background: s.color }} /> {s.name}
          </Link>
        ))}
      </div>

      {open.length > 0 && (
        <div className="space-y-2">
          {open.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-brand bg-brand-soft p-4">
              <PlayCircle className="size-6 text-brand" />
              <div className="flex-1">
                <div className="font-bold text-ink">{fmt(T.inProgress, { title: a.test.title })}</div>
                <div className="text-sm text-ink-2">{fmt(T.started, { date: date(a.startedAt, { hour: "numeric", minute: "2-digit" }) })}</div>
              </div>
              <ButtonLink href={`/tests/attempt/${a.id}`}>{T.resume}</ButtonLink>
            </div>
          ))}
        </div>
      )}

      <section>
        <h2 className="mb-4 font-display text-lg font-bold">{T.exams}</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((test) => {
            const b = best.get(test.id);
            const { minutes, questions } = info(test);
            return (
              <div key={test.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  {test.subject ? <SubjectIcon icon={test.subject.icon} color={test.subject.color} size={44} /> : <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand"><Layers className="size-5" /></span>}
                  {b && (
                    <div className="text-right">
                      <div className="text-xs text-muted">{T.best}</div>
                      <div className="font-display text-2xl font-extrabold text-ink">{b.score}%</div>
                    </div>
                  )}
                </div>
                <h3 className="mt-3 font-display text-lg font-bold">{test.title}</h3>
                {test.description && <p className="mt-1 flex-1 text-sm text-muted">{test.description}</p>}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {test.subject ? <SubjectBadge name={test.subject.name} color={test.subject.color} /> : <Badge tone="brand">{T.mixedSubjects}</Badge>}
                  <Badge><Clock className="size-3" /> {fmt(T.minutesShort, { n: minutes })}</Badge>
                  <Badge>{plural(t.common.questions, questions)}</Badge>
                  {test.modules.length > 1 && <Badge>{plural(T.sections, test.modules.length)}</Badge>}
                  {test.centerId && <Badge tone="brand">{t.common.yourCenter}</Badge>}
                </div>
                <ButtonLink href={`/tests/${test.id}`} className="mt-5">{b ? fmt(T.retake, { n: b.count }) : T.startTest}</ButtonLink>
              </div>
            );
          })}
          {exams.length === 0 && <p className="text-sm text-muted">{T.noExams}</p>}
        </div>
      </section>

      {topics.length > 0 && (
        <section>
          <h2 className="mb-1 font-display text-lg font-bold">{T.topicQuizzes}</h2>
          <p className="mb-4 text-sm text-muted">{T.topicQuizzesText}</p>
          {subjects
            .filter((s) => topics.some((test) => test.subjectId === s.id))
            .map((s) => (
              <div key={s.id} className="mb-6">
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-wider text-muted uppercase">
                  <span className="size-2 rounded-full" style={{ background: s.color }} /> {s.name}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {topics
                    .filter((test) => test.subjectId === s.id)
                    .map((test) => {
                      const b = best.get(test.id);
                      const { minutes, questions } = info(test);
                      return (
                        <Link key={test.id} href={`/tests/${test.id}`} className="group rounded-xl border border-line bg-surface p-4 hover:border-line-strong">
                          <div className="flex items-start justify-between gap-2">
                            <span className="flex items-center gap-2 font-semibold text-ink group-hover:text-brand"><FileText className="size-4 text-muted" /> {test.title}</span>
                            {b && <Badge tone={b.score >= 80 ? "success" : b.score >= 60 ? "warning" : "danger"}>{b.score}%</Badge>}
                          </div>
                          <div className="mt-1 text-xs text-muted">{plural(t.common.questions, questions)} · {fmt(T.minutesShort, { n: minutes })}</div>
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Trophy className="size-5 text-muted" /> {T.yourResults}</h2>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-3 font-semibold">{t.charts.colTest}</th>
                  <th className="px-3 py-3 font-semibold">{t.charts.colSubject}</th>
                  <th className="px-3 py-3 font-semibold">{t.charts.colDate}</th>
                  <th className="px-3 py-3 text-right font-semibold">{T.colCorrect}</th>
                  <th className="px-3 py-3 text-right font-semibold">{t.charts.colScore}</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {completed.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 font-semibold">{a.test.title}</td>
                    <td className="px-3 py-3">{a.test.subject ? <SubjectBadge name={a.test.subject.name} color={a.test.subject.color} /> : <Badge>{t.common.mixed}</Badge>}</td>
                    <td className="px-3 py-3 text-muted">{date(a.finishedAt ?? a.startedAt)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{a.correct}/{a.total}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums">{a.score}%</td>
                    <td className="px-5 py-3 text-right"><Link href={`/tests/attempt/${a.id}/results`} className="font-semibold text-brand hover:underline">{T.results}</Link></td>
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
