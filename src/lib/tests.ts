import "server-only";
import { db } from "@/lib/db";
import { recordPractice } from "@/lib/activity";
import { isCorrect, sectionScore, type Section } from "@/lib/sat";

export const BREAK_MINUTES = 10;
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
          modules: {
            orderBy: { order: "asc" },
            include: { questions: { orderBy: { order: "asc" }, include: { question: true } } },
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

export function breakSecondsLeft(attempt: LoadedAttempt) {
  return Math.max(0, BREAK_MINUTES * 60 - Math.round((Date.now() - attempt.moduleStarted.getTime()) / 1000));
}

/** A full test breaks between the last Reading & Writing module and the first Math module. */
export function isBreakBoundary(attempt: LoadedAttempt) {
  const mods = attempt.test.modules;
  const current = mods[attempt.moduleIndex];
  const next = mods[attempt.moduleIndex + 1];
  return attempt.test.kind === "FULL" && current?.section === "RW" && next?.section === "MATH";
}

/** Grades every module, stores scores and per-question attempts, and logs practice. */
export async function finalizeAttempt(attempt: LoadedAttempt) {
  const answers = parseJson<Record<string, string>>(attempt.answers, {});
  const tally: Record<Section, [number, number]> = { RW: [0, 0], MATH: [0, 0] };
  const rows: { userId: string; questionId: string; response: string; correct: boolean; source: string }[] = [];

  for (const mod of attempt.test.modules) {
    for (const { question: q } of mod.questions) {
      const response = answers[q.id] ?? "";
      const correct = isCorrect(q.type, q.answer, response);
      const section = q.section as Section;
      tally[section][1]++;
      if (correct) tally[section][0]++;
      if (response) rows.push({ userId: attempt.userId, questionId: q.id, response: response.slice(0, 40), correct, source: "TEST" });
    }
  }

  const rwScore = tally.RW[1] ? sectionScore(...tally.RW) : null;
  const mathScore = tally.MATH[1] ? sectionScore(...tally.MATH) : null;
  const correct = tally.RW[0] + tally.MATH[0];
  const total = tally.RW[1] + tally.MATH[1];
  const minutes = Math.round((Date.now() - attempt.startedAt.getTime()) / 60000);

  await db.$transaction([
    db.testAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "COMPLETED",
        finishedAt: new Date(),
        correct,
        total,
        rwScore,
        mathScore,
        totalScore: attempt.test.kind === "FULL" && rwScore !== null && mathScore !== null ? rwScore + mathScore : null,
      },
    }),
    db.questionAttempt.createMany({ data: rows }),
  ]);
  await recordPractice(attempt.userId, {
    questions: rows.length,
    correct: rows.filter((r) => r.correct).length,
    minutes: Math.min(minutes, 240),
    xp: correct * 10 + rows.length * 2 + (attempt.test.kind === "FULL" ? 200 : 40),
  });
}
