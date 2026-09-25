"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Bookmark, ChevronDown, ChevronUp, Eye, EyeOff, LogOut, MapPin, X } from "lucide-react";
import { saveProgress, submitModule } from "@/app/(app)/tests/actions";
import { Choices, GridIn } from "@/components/question/choices";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { fmt, rich } from "@/lib/i18n/format";

type Q = { id: string; type: string; passage: string | null; stem: string; choices: string[] };

type Props = {
  attemptId: string;
  studentName: string;
  testTitle: string;
  module: { index: number; count: number; title: string; seconds: number; isLast: boolean };
  questions: Q[];
  initialAnswers: Record<string, string>;
  initialFlagged: string[];
};

function clock(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Counts down to a fixed end time; calls onExpire once when it reaches zero. */
function useCountdown(seconds: number, onExpire: () => void, active = true) {
  const [endAt] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);
  const remaining = Math.max(0, Math.round((endAt - now) / 1000));
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [active]);
  useEffect(() => {
    if (active && remaining === 0 && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [active, remaining, onExpire]);
  return remaining;
}

export function Runner(props: Props) {
  return <ModuleRunner {...props} />;
}

function ModuleRunner({ attemptId, studentName, testTitle, module, questions, initialAnswers, initialFlagged }: Props) {
  const router = useRouter();
  const t = useT();
  const E = t.exam;
  const [index, setIndex] = useState(0); // questions.length = review screen
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [flagged, setFlagged] = useState<string[]>(initialFlagged);
  const [struck, setStruck] = useState<Record<string, string[]>>({});
  const [eliminator, setEliminator] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  const [panel, setPanel] = useState<null | "nav" | "directions">(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [confirming, setConfirming] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const submitted = useRef(false);
  const latest = useRef({ answers, flagged });
  useEffect(() => {
    latest.current = { answers, flagged };
  }, [answers, flagged]);

  const submit = useCallback(() => {
    if (submitted.current) return;
    submitted.current = true;
    startSubmit(async () => {
      const res = await submitModule(attemptId, latest.current.answers, latest.current.flagged);
      if (res.done) router.push(`/tests/attempt/${attemptId}/results`);
      else router.refresh();
    });
  }, [attemptId, router]);

  const remaining = useCountdown(module.seconds, submit);

  // Autosave shortly after every change.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const id = setTimeout(async () => {
      setSaveState("saving");
      try {
        const res = await saveProgress(attemptId, answers, flagged);
        setSaveState(res.ok ? "saved" : "error");
      } catch {
        setSaveState("error");
      }
    }, 600);
    return () => clearTimeout(id);
  }, [answers, flagged, attemptId]);

  const q = questions[index];
  const onReview = index === questions.length;
  const unanswered = questions.filter((x) => !answers[x.id]).length;
  const setAnswer = (id: string, v: string) => setAnswers((a) => ({ ...a, [id]: v }));
  const toggleFlag = (id: string) => setFlagged((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
  const go = (i: number) => {
    setIndex(i);
    setPanel(null);
  };
  const lowTime = remaining <= 300;

  return (
    <div className="flex h-dvh flex-col bg-surface">
      {/* ── Top bar ── */}
      <header className="relative z-20 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-line px-4 sm:px-6">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-ink sm:text-base">
            {module.count > 1 ? fmt(E.sectionOf, { n: module.index + 1, count: module.count }) : ""}
            {module.title}
          </div>
          <button onClick={() => setPanel(panel === "directions" ? null : "directions")} className="flex items-center gap-1 text-xs font-semibold text-ink-2 hover:text-ink">
            {E.directions} {panel === "directions" ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        </div>
        <div className="flex flex-col items-center">
          {hideTimer ? (
            <span className="h-7 text-sm text-muted">{E.timerHidden}</span>
          ) : (
            <span className={cn("font-display text-xl font-extrabold tabular-nums", lowTime ? "text-danger" : "text-ink")} role="timer" aria-live={lowTime ? "polite" : "off"}>
              {clock(remaining)}
            </span>
          )}
          <button onClick={() => setHideTimer((h) => !h)} className="flex items-center gap-1 rounded-full border border-line px-2.5 py-0.5 text-[11px] font-semibold text-ink-2 hover:bg-surface-2">
            {hideTimer ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
            {hideTimer ? E.show : E.hide}
          </button>
        </div>
        <div className="flex items-center justify-end gap-1">
          <Link href="/tests" className="flex flex-col items-center rounded-lg px-2 py-1 text-[11px] font-semibold text-ink-2 hover:bg-surface-2" title={E.saveExitTitle}>
            <LogOut className="size-5" /> {E.saveExit}
          </Link>
        </div>
      </header>
      <div aria-hidden className="h-1 shrink-0 bg-[repeating-linear-gradient(90deg,var(--brand)_0_14px,transparent_14px_20px)] opacity-60" />

      {panel === "directions" && (
        <Popover onClose={() => setPanel(null)} className="left-4 top-20 max-w-xl">
          <h2 className="font-display text-lg font-bold">{E.directions}</h2>
          <div className="mt-2 space-y-2 text-sm text-ink-2">
            <p>{rich(E.directionsP1, { mark: <strong>{E.markForReview}</strong> })}</p>
            <p>{E.directionsP2}</p>
          </div>
        </Popover>
      )}

      {/* ── Question area ── */}
      <main className="min-h-0 flex-1 overflow-hidden">
        {onReview ? (
          <div className="h-full overflow-y-auto px-5 py-10">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="font-display text-3xl font-extrabold">{E.checkWork}</h1>
              <p className="mt-2 text-muted">{E.checkWorkText}</p>
              <div className="mt-8 rounded-2xl border border-line p-6 text-left shadow-card">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <span className="font-bold">{testTitle}</span>
                  <Legend />
                </div>
                <QuestionGrid questions={questions} answers={answers} flagged={flagged} current={-1} onPick={go} />
              </div>
            </div>
          </div>
        ) : (
          <div className={cn("grid h-full", q.passage ? "lg:grid-cols-2" : "grid-cols-1")}>
            {q.passage && (
              <section className="overflow-y-auto border-b border-line px-6 py-8 lg:border-r lg:border-b-0 lg:px-10" aria-label={E.passage}>
                <Markdown className="passage mx-auto max-w-2xl">{q.passage}</Markdown>
              </section>
            )}
            <section className="overflow-y-auto px-6 py-8 lg:px-10" aria-label={fmt(t.question.questionN, { n: index + 1 })}>
              <div className={cn("mx-auto", q.passage ? "max-w-2xl" : "max-w-3xl")}>
                <div className="mb-5 flex items-center gap-3 border-b-2 border-dashed border-line bg-surface-2 pr-2">
                  <span className="grid size-9 place-items-center bg-ink font-bold text-surface">{index + 1}</span>
                  <button onClick={() => toggleFlag(q.id)} aria-pressed={flagged.includes(q.id)} className="flex items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-ink">
                    <Bookmark className={cn("size-4", flagged.includes(q.id) && "fill-danger text-danger")} />
                    {E.markForReview}
                  </button>
                  {q.type === "MCQ" && (
                    <button
                      onClick={() => setEliminator((e) => !e)}
                      aria-pressed={eliminator}
                      title={E.answerEliminator}
                      className={cn("ml-auto rounded-md border px-2 py-0.5 text-xs font-bold", eliminator ? "border-brand bg-brand text-white" : "border-line-strong text-ink-2")}
                    >
                      <span className="line-through">ABC</span>
                    </button>
                  )}
                </div>
                <Markdown className={cn("text-[15px] text-ink", q.passage && "font-semibold")}>{q.stem}</Markdown>
                <div className="mt-5">
                  {q.type === "MCQ" ? (
                    <Choices
                      choices={q.choices}
                      value={answers[q.id] ?? ""}
                      onChange={(v) => setAnswer(q.id, v)}
                      struck={struck[q.id] ?? []}
                      onStrike={
                        eliminator
                          ? (l) => setStruck((s) => ({ ...s, [q.id]: (s[q.id] ?? []).includes(l) ? s[q.id].filter((x) => x !== l) : [...(s[q.id] ?? []), l] }))
                          : undefined
                      }
                    />
                  ) : (
                    <GridIn value={answers[q.id] ?? ""} onChange={(v) => setAnswer(q.id, v)} />
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ── Bottom bar ── */}
      <footer className="relative z-20 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-line px-4 sm:px-6">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-ink">{studentName}</div>
          <div className="text-[11px] text-muted">{saveState === "saving" ? t.common.saving : saveState === "error" ? E.notSaved : E.allSaved}</div>
        </div>
        <div>
          {!onReview && (
            <button
              onClick={() => setPanel(panel === "nav" ? null : "nav")}
              className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm font-bold text-surface"
              aria-expanded={panel === "nav"}
            >
              {fmt(E.questionOf, { n: index + 1, count: questions.length })}
              {panel === "nav" ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
          )}
        </div>
        <div className="flex justify-end gap-2">
          {index > 0 && (
            <Button variant="outline" className="rounded-full" onClick={() => go(index - 1)}>
              {t.common.back}
            </Button>
          )}
          {onReview ? (
            <Button className="rounded-full" disabled={submitting} onClick={() => (unanswered ? setConfirming(true) : submit())}>
              {submitting ? E.submitting : module.isLast ? E.finishTest : E.submitSection}
            </Button>
          ) : (
            <Button className="rounded-full" onClick={() => go(index + 1)}>
              {t.common.next}
            </Button>
          )}
        </div>
      </footer>

      {panel === "nav" && !onReview && (
        <Popover onClose={() => setPanel(null)} className="bottom-20 left-1/2 w-[min(92vw,560px)] -translate-x-1/2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold">{module.title}</span>
            <Legend />
          </div>
          <QuestionGrid questions={questions} answers={answers} flagged={flagged} current={index} onPick={go} />
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => go(questions.length)}>
              {E.goToReview}
            </Button>
          </div>
        </Popover>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-5" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-pop">
            <h2 className="font-display text-lg font-bold">{fmt(E.submitUnanswered, { n: unanswered })}</h2>
            <p className="mt-2 text-sm text-muted">{E.submitWarning}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                {E.keepWorking}
              </Button>
              <Button
                disabled={submitting}
                onClick={() => {
                  setConfirming(false);
                  submit();
                }}
              >
                {E.submitAnyway}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Popover({ children, onClose, className }: { children: React.ReactNode; onClose: () => void; className?: string }) {
  const t = useT();
  return (
    <>
      <button aria-label={t.common.close} data-no-press className="fixed inset-0 z-30 cursor-default" onClick={onClose} />
      <div className={cn("fixed z-40 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-pop", className)}>
        <button onClick={onClose} aria-label={t.common.close} className="absolute top-3 right-3 grid size-7 place-items-center rounded-lg text-muted hover:bg-surface-2">
          <X className="size-4" />
        </button>
        {children}
      </div>
    </>
  );
}

function Legend() {
  const E = useT().exam;
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-ink-2">
      <span className="flex items-center gap-1.5"><MapPin className="size-3.5" /> {E.legendCurrent}</span>
      <span className="flex items-center gap-1.5"><span className="size-3.5 rounded border border-dashed border-ink-2" /> {E.legendUnanswered}</span>
      <span className="flex items-center gap-1.5"><Bookmark className="size-3.5 fill-danger text-danger" /> {E.legendReview}</span>
    </div>
  );
}

function QuestionGrid({
  questions,
  answers,
  flagged,
  current,
  onPick,
}: {
  questions: Q[];
  answers: Record<string, string>;
  flagged: string[];
  current: number;
  onPick: (i: number) => void;
}) {
  const t = useT();
  return (
    <div className="grid grid-cols-7 gap-2.5 sm:grid-cols-10">
      {questions.map((x, i) => {
        const done = Boolean(answers[x.id]);
        return (
          <button
            key={x.id}
            onClick={() => onPick(i)}
            className={cn(
              "relative grid aspect-square place-items-center rounded-md text-sm font-bold transition-colors",
              done ? "bg-brand text-white" : "border border-dashed border-ink-2 text-brand hover:bg-surface-2",
            )}
            aria-label={`${fmt(t.question.questionN, { n: i + 1 })}${done ? t.exam.answeredSuffix : t.exam.unansweredSuffix}${flagged.includes(x.id) ? t.exam.flaggedSuffix : ""}`}
          >
            {i + 1}
            {i === current && <MapPin className="absolute -top-3.5 left-1/2 size-3.5 -translate-x-1/2 text-ink" />}
            {flagged.includes(x.id) && <Bookmark className="absolute -top-1.5 -right-1.5 size-3.5 fill-danger text-danger" />}
          </button>
        );
      })}
    </div>
  );
}
