import "server-only";
import { db } from "@/lib/db";
import { recordPractice } from "@/lib/activity";
import { isCorrect } from "@/lib/quiz";
import { pct } from "@/lib/utils";

/** Answers saved up to this long after the timer ends still count (network lag). */
export const GRACE_SECONDS = 90;

export function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadAttempt(attemptId: string, userId: string) {
  return db.testAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      test: {
        include: {
          subject: true,
          modules: {
            orderBy: { order: "asc" },
            include: { questions: { orderBy: { order: "asc" }, include: { question: { include: { topic: true, subject: true } } } } },
          },
        },
      },
    },
  });
}

export type LoadedAttempt = NonNullable<Awaited<ReturnType<typeof loadAttempt>>>;

export function secondsLeft(attempt: LoadedAttempt) {
  const mod = attempt.test.modules[attempt.moduleIndex];
  if (!mod) return 0;
  const elapsed = (Date.now() - attempt.moduleStarted.getTime()) / 1000;
  return Math.max(0, Math.round(mod.minutes * 60 - elapsed));
}

/** Per-section results for a completed attempt. */
export function sectionResults(attempt: LoadedAttempt) {
  const answers = parseJson<Record<string, string>>(attempt.answers, {});
  return attempt.test.modules.map((m) => {
    const correct = m.questions.filter(({ question: q }) => isCorrect(q.type, q.answer, answers[q.id] ?? "")).length;
    return { id: m.id, title: m.title, correct, total: m.questions.length, percent: pct(correct, m.questions.length) };
  });
}

/** Grades every section, stores the score and per-question attempts, and logs practice. */
export async function finalizeAttempt(attempt: LoadedAttempt) {
  const answers = parseJson<Record<string, string>>(attempt.answers, {});
  const rows: { userId: string; questionId: string; response: string; correct: boolean; source: string }[] = [];
  let correct = 0;
  let total = 0;
  for (const mod of attempt.test.modules) {
    for (const { question: q } of mod.questions) {
      const response = answers[q.id] ?? "";
      const ok = isCorrect(q.type, q.answer, response);
      total++;
      if (ok) correct++;
      if (response) rows.push({ userId: attempt.userId, questionId: q.id, response: response.slice(0, 60), correct: ok, source: "TEST" });
    }
  }
  const minutes = Math.round((Date.now() - attempt.startedAt.getTime()) / 60000);

  await db.$transaction([
    db.testAttempt.update({
      where: { id: attempt.id },
      data: { status: "COMPLETED", finishedAt: new Date(), correct, total, score: pct(correct, total) },
    }),
    db.questionAttempt.createMany({ data: rows }),
  ]);
  await recordPractice(attempt.userId, {
    questions: rows.length,
    correct: rows.filter((r) => r.correct).length,
    minutes: Math.min(minutes, 240),
    xp: correct * 10 + rows.length * 2 + (attempt.test.kind === "EXAM" ? 150 : 40),
  });
}
