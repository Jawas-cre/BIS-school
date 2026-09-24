import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Check, ChevronRight, Clock, Minus, RotateCcw, Sparkles, X } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { loadAttempt, parseJson, sectionResults } from "@/lib/tests";
import { isCorrect, parseChoices } from "@/lib/quiz";
import { SubjectBadge } from "@/components/subject-icon";
import { cn, formatDate, pct } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import { Badge, DifficultyBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Progress } from "@/components/ui/misc";
import { startTest } from "@/app/(app)/tests/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export const metadata: Metadata = { title: "Score report" };

export default async function ResultsPage({ params, searchParams }: PageProps<"/tests/attempt/[attemptId]/results">) {
  const user = await requireStudentArea();
  const { attemptId } = await params;
  const { show } = await searchParams;
  const attempt = await loadAttempt(attemptId, user.id);
  if (!attempt) notFound();
  if (attempt.status !== "COMPLETED") redirect(`/tests/attempt/${attempt.id}`);

  const answers = parseJson<Record<string, string>>(attempt.answers, {});
  const flagged = new Set(parseJson<string[]>(attempt.flagged, []));
  const items = attempt.test.modules.flatMap((m) =>
    m.questions.map(({ question: q }, i) => {
      const response = answers[q.id] ?? "";
      return { q, module: m.title, number: i + 1, response, correct: isCorrect(q.type, q.answer, response), omitted: !response };
    }),
  );

  // Breakdown by topic, in the order topics first appear in the test.
  const topics: { id: string; name: string; subject: string; total: number; correct: number }[] = [];
  for (const it of items) {
    let row = topics.find((t) => t.id === it.q.topicId);
    if (!row) {
      row = { id: it.q.topicId, name: it.q.topic.name, subject: it.q.subject.name, total: 0, correct: 0 };
      topics.push(row);
    }
    row.total++;
    if (it.correct) row.correct++;
  }
  const sections = sectionResults(attempt);
  const mixed = new Set(topics.map((t) => t.subject)).size > 1;

  const filter = show === "incorrect" || show === "omitted" || show === "flagged" ? show : "all";
  const visible = items.filter((it) =>
    filter === "incorrect" ? !it.correct && !it.omitted : filter === "omitted" ? it.omitted : filter === "flagged" ? flagged.has(it.q.id) : true,
  );
  const minutes = attempt.finishedAt ? Math.round((attempt.finishedAt.getTime() - attempt.startedAt.getTime()) / 60000) : null;

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/tests" className="hover:text-ink">Mock Tests</Link>
        <ChevronRight className="size-3.5" />
        <span>Score report</span>
      </nav>

      <section className="overflow-hidden rounded-3xl border border-line bg-surface shadow-card">
        <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {attempt.test.subject && <SubjectBadge name={attempt.test.subject.name} color={attempt.test.subject.color} />}
              <span className="text-sm font-semibold text-muted">{attempt.test.title}</span>
            </div>
            <div className="mt-1 text-xs text-muted">
              Completed {formatDate(attempt.finishedAt!, { hour: "numeric", minute: "2-digit" })}
              {minutes !== null && <> · <Clock className="inline size-3" /> {minutes} min</>}
            </div>
            <div className="mt-5 text-sm font-semibold text-ink-2">Score</div>
            <div className="font-display text-6xl font-extrabold tracking-tight">{attempt.score}%</div>
            <div className="mt-1 text-sm text-muted">{attempt.correct} of {attempt.total} correct</div>
            <p className="mt-4 text-sm text-ink-2">
              {(attempt.score ?? 0) >= 85 ? "Excellent work — keep it up!" : (attempt.score ?? 0) >= 65 ? "Good result. Review your mistakes below to push higher." : "Keep practising: review the explanations below, then retake the test."}
            </p>
          </div>
          <div className="space-y-3">
            {sections.length > 1 &&
              sections.map((sec) => (
                <div key={sec.id} className="rounded-2xl bg-surface-2 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-semibold">{sec.title}</span>
                    <span className="font-display text-2xl font-extrabold">{sec.percent}%</span>
                  </div>
                  <Progress value={sec.percent} className="mt-2" />
                  <div className="mt-1 text-xs text-muted">{sec.correct}/{sec.total} correct</div>
                </div>
              ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <form action={startTest.bind(null, attempt.testId)}>
                <SubmitButton variant="outline" size="sm" pendingText="Starting…">
                  <RotateCcw className="size-4" /> Retake
                </SubmitButton>
              </form>
              <ButtonLink href="/tests" variant="ghost" size="sm">All tests</ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <h2 className="font-display text-lg font-bold">Results by topic</h2>
        <div className="mt-4 grid gap-x-10 gap-y-4 md:grid-cols-2">
          {topics.map((d) => {
            const p = pct(d.correct, d.total);
            return (
              <div key={d.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">{mixed ? `${d.subject} · ` : ""}{d.name}</span>
                  <span className="text-muted tabular-nums">
                    {d.correct}/{d.total} · <strong className="text-ink">{p}%</strong>
                  </span>
                </div>
                <Progress value={p} tone={p >= 80 ? "success" : p >= 60 ? "brand" : p >= 40 ? "warning" : "danger"} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">Review questions</h2>
          <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
            {(["all", "incorrect", "omitted", "flagged"] as const).map((f) => (
              <Link
                key={f}
                href={`?show=${f}`}
                scroll={false}
                className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold capitalize", filter === f ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2")}
              >
                {f}
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {visible.length === 0 && <p className="rounded-2xl border border-line bg-surface p-8 text-center text-muted">Nothing to show here.</p>}
          {visible.map((it) => {
            const choices = parseChoices(it.q.choices);
            const key = it.q.answer.split("|")[0];
            return (
              <details key={it.q.id} className="group rounded-2xl border border-line bg-surface shadow-card">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5">
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full text-white",
                      it.omitted ? "bg-muted" : it.correct ? "bg-success" : "bg-danger",
                    )}
                  >
                    {it.omitted ? <Minus className="size-3.5" /> : it.correct ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  </span>
                  <span className="w-24 shrink-0 text-xs text-muted sm:w-36">
                    {it.module} · Q{it.number}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.q.topic.name}</span>
                  <DifficultyBadge difficulty={it.q.difficulty} />
                  <span className="hidden w-24 text-right text-xs text-muted sm:block">
                    {it.omitted ? "Omitted" : `You: ${it.response}`} · Key: {key}
                  </span>
                  <ChevronRight className="size-4 text-muted transition-transform group-open:rotate-90" />
                </summary>
                <div className="border-t border-line p-5 sm:p-6">
                  {it.q.passage && <Markdown className="passage mb-4">{it.q.passage}</Markdown>}
                  <Markdown className={cn("text-[15px] text-ink", it.q.passage && "font-semibold")}>{it.q.stem}</Markdown>
                  {choices.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {choices.map((c, i) => {
                        const letter = "ABCD"[i];
                        return (
                          <li
                            key={letter}
                            className={cn(
                              "flex gap-3 rounded-xl border px-3 py-2 text-sm",
                              letter === key ? "border-success bg-success-soft" : letter === it.response ? "border-danger bg-danger-soft" : "border-line",
                            )}
                          >
                            <strong>{letter}</strong>
                            <Markdown className="[&_p]:m-0">{c}</Markdown>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {it.q.type === "SHORT" && (
                    <p className="mt-3 text-sm">
                      Your answer: <strong>{it.response || "—"}</strong> · Correct answer: <strong>{key}</strong>
                    </p>
                  )}
                  <div className="mt-4 rounded-xl bg-surface-2 p-4">
                    <div className="mb-1 text-xs font-bold tracking-wider text-muted uppercase">Explanation</div>
                    <Markdown className="text-[15px]">{it.q.explanation}</Markdown>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                    <Badge>{it.q.topic.name}</Badge>
                    <Link href={`/assistant?q=${encodeURIComponent(`Explain this ${it.q.subject.name} question step by step:\n\n${it.q.passage ? `${it.q.passage}\n\n` : ""}${it.q.stem}`.slice(0, 1500))}`} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                      <Sparkles className="size-4" /> Ask AI
                    </Link>
                    <Link href={`/questions/${it.q.id}`} className="font-semibold text-ink-2 hover:text-ink">
                      Practice again
                    </Link>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
