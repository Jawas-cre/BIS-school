import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ChevronRight, Clock, Flag, ListChecks } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { SubmitButton } from "@/components/ui/submit-button";
import { startTest } from "../actions";
import { fmt, plural, rich } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.tests.startTest);

export default async function TestIntroPage({ params }: PageProps<"/tests/[testId]">) {
  const user = await requireStudentArea();
  const { testId } = await params;
  const t = await getT();
  const T = t.tests;
  const test = await db.test.findFirst({
    where: { id: testId, published: true, ...visibleTo(user.centerId) },
    include: { subject: true, modules: { orderBy: { order: "asc" }, include: { _count: { select: { questions: true } } } } },
  });
  if (!test) notFound();
  const open = await db.testAttempt.findFirst({ where: { userId: user.id, testId, status: { not: "COMPLETED" } } });
  const minutes = test.modules.reduce((s, m) => s + m.minutes, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/tests" className="hover:text-ink">
          {t.nav.tests}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate">{test.title}</span>
      </nav>
      <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-10">
        {test.subject && <p className="mb-1 text-sm font-bold" style={{ color: test.subject.color }}>{test.subject.name}</p>}
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{test.title}</h1>
        {test.description && <p className="mt-2 text-muted">{test.description}</p>}

        <ol className="mt-8 space-y-2">
          {test.modules.map((m, i) => (
            <li key={m.id}>
              <div className="flex items-center gap-4 rounded-xl bg-surface-2 px-4 py-3">
                <span className="grid size-8 place-items-center rounded-full bg-surface text-sm font-bold text-ink-2">{i + 1}</span>
                <span className="flex-1 font-semibold">{m.title}</span>
                <span className="text-sm text-muted tabular-nums">
                  {fmt(T.moduleInfo, { q: m._count.questions, min: m.minutes })}
                </span>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex gap-3">
            <Clock className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>
              {rich(T.totalTime, { minutes: <strong>{plural(t.common.minutes, minutes)}</strong> })}
            </span>
          </div>
          <div className="flex gap-3">
            <Flag className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>
              {rich(T.markReviewText, { mark: <strong>{T.markForReview}</strong> })}
            </span>
          </div>
          <div className="flex gap-3">
            <ListChecks className="mt-0.5 size-4 shrink-0 text-brand" />
            <span>{T.noPenalty}</span>
          </div>
        </div>

        {open && (
          <p className="mt-6 flex items-center gap-2 rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
            <AlertCircle className="size-4" /> {T.unfinished}
          </p>
        )}

        <form action={startTest.bind(null, test.id)} className="mt-8">
          <SubmitButton size="lg" className="w-full sm:w-auto" pendingText={T.preparing}>
            {open ? T.resumeTest : T.startTest}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
