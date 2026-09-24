"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, RotateCcw, Trophy } from "lucide-react";
import { markUnitComplete, submitUnitQuiz, type QuizResult } from "../actions";
import { Choices, GridIn } from "@/components/question/choices";
import { Markdown } from "@/components/markdown";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuizQuestion = { id: string; type: string; passage: string | null; stem: string; choices: string[] };

export function UnitQuiz({
  unitId,
  questions,
  completed,
  nextHref,
}: {
  unitId: string;
  questions: QuizQuestion[];
  completed: boolean;
  nextHref: string | null;
}) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();

  if (questions.length === 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div>
          <div className="font-display font-bold">Finished reading?</div>
          <p className="text-sm text-muted">Mark this unit as complete to unlock the next one.</p>
        </div>
        {completed ? (
          nextHref && <ButtonLink href={nextHref}>Next unit <ArrowRight className="size-4" /></ButtonLink>
        ) : (
          <Button disabled={pending} onClick={() => start(async () => { await markUnitComplete(unitId); router.refresh(); })}>
            <CheckCircle2 className="size-4" /> Mark as complete
          </Button>
        )}
      </div>
    );
  }

  const answered = questions.filter((q) => responses[q.id]).length;
  const byId = new Map(result?.items.map((i) => [i.id, i]));

  return (
    <section className="rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-bold">Unit quiz</h2>
          <p className="text-sm text-muted">{questions.length} questions · score 60% or more to complete the unit</p>
        </div>
        {!result && (
          <span className="text-sm font-semibold text-muted tabular-nums">
            {answered}/{questions.length} answered
          </span>
        )}
      </div>

      {result && (
        <div className={cn("m-5 flex flex-wrap items-center gap-4 rounded-2xl p-5", result.passed ? "bg-success-soft" : "bg-warning-soft")}>
          <Trophy className={cn("size-8", result.passed ? "text-success" : "text-warning")} />
          <div className="flex-1">
            <div className="font-display text-2xl font-extrabold">{result.score}%</div>
            <div className="text-sm text-ink-2">
              {result.passed ? "Unit complete — the next unit is unlocked." : "Almost there. Review the explanations and try again."}
            </div>
          </div>
          {result.passed && nextHref ? (
            <ButtonLink href={nextHref}>
              Next unit <ArrowRight className="size-4" />
            </ButtonLink>
          ) : (
            <Button variant="outline" onClick={() => { setResult(null); setResponses({}); router.refresh(); }}>
              <RotateCcw className="size-4" /> Try again
            </Button>
          )}
        </div>
      )}

      <ol className="divide-y divide-line">
        {questions.map((q, i) => {
          const r = byId.get(q.id);
          return (
            <li key={q.id} className="p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-muted">
                Question {i + 1}
                {r && <span className={r.correct ? "text-success" : "text-danger"}>· {r.correct ? "Correct" : "Incorrect"}</span>}
              </div>
              {q.passage && <Markdown className="passage mb-4">{q.passage}</Markdown>}
              <Markdown className={cn("mb-4 text-[15px] text-ink", q.passage && "font-semibold")}>{q.stem}</Markdown>
              {q.type === "MCQ" ? (
                <Choices
                  choices={q.choices}
                  value={responses[q.id] ?? ""}
                  onChange={(v) => setResponses((s) => ({ ...s, [q.id]: v }))}
                  result={r ? { answer: r.answer } : null}
                />
              ) : (
                <GridIn
                  value={responses[q.id] ?? ""}
                  onChange={(v) => setResponses((s) => ({ ...s, [q.id]: v }))}
                  result={r ? { correct: r.correct, answer: r.answer } : null}
                />
              )}
              {r && (
                <div className="mt-4 rounded-xl bg-surface-2 p-4">
                  <div className="mb-1 text-xs font-bold tracking-wider text-muted uppercase">Explanation</div>
                  <Markdown className="text-[15px]">{r.explanation}</Markdown>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="border-t border-line p-5">
          <Button
            size="lg"
            disabled={answered < questions.length || pending}
            onClick={() => start(async () => setResult(await submitUnitQuiz(unitId, responses)))}
          >
            {pending ? "Grading…" : "Submit quiz"}
          </Button>
        </div>
      )}
    </section>
  );
}
