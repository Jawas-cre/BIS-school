import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { addDays, dayKey, pct } from "@/lib/utils";

type Row = { key: string; total: bigint | number; correct: bigint | number };

/** Answer counts per subject (or topic) id for a set of users. Works on SQLite and Postgres. */
export async function accuracyBy(userIds: string[], by: "subject" | "topic") {
  if (userIds.length === 0) return new Map<string, { total: number; correct: number }>();
  const column = by === "subject" ? Prisma.sql`q."subjectId"` : Prisma.sql`q."topicId"`;
  const rows = await db.$queryRaw<Row[]>`
    SELECT ${column} AS key,
           COUNT(*) AS total,
           SUM(CASE WHEN a."correct" THEN 1 ELSE 0 END) AS correct
    FROM "QuestionAttempt" a
    JOIN "Question" q ON q."id" = a."questionId"
    WHERE a."userId" IN (${Prisma.join(userIds)})
    GROUP BY ${column}`;
  return new Map(rows.map((r) => [r.key, { total: Number(r.total), correct: Number(r.correct) }]));
}

/** Accuracy per subject for a student, next to the average of their group-mates. */
export async function subjectComparison(userId: string, peerIds: string[], subjects: { id: string; name: string; color: string }[]) {
  const [mine, peers] = await Promise.all([accuracyBy([userId], "subject"), accuracyBy(peerIds, "subject")]);
  return subjects
    .map((s) => {
      const m = mine.get(s.id);
      const g = peers.get(s.id);
      return {
        id: s.id,
        name: s.name,
        color: s.color,
        you: m?.total ? pct(m.correct, m.total) : null,
        group: g?.total ? pct(g.correct, g.total) : null,
        attempts: m?.total ?? 0,
      };
    })
    .filter((r) => r.attempts > 0 || r.group !== null);
}

/** Consecutive days ending today, padded so the first day is a Monday. */
export async function activityCalendar(userId: string, weeks = 26) {
  const today = dayKey();
  const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const start = addDays(today, -(weeks - 1) * 7 - weekday);
  const rows = await db.activityDay.findMany({ where: { userId, day: { gte: start } } });
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const days = [];
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const r = byDay.get(d);
    days.push({ day: d, questions: r?.questions ?? 0, correct: r?.correct ?? 0 });
  }
  return days;
}

export async function userTotals(userId: string) {
  const [answered, correct, distinct, tests, avgScore, units, mastered] = await Promise.all([
    db.questionAttempt.count({ where: { userId } }),
    db.questionAttempt.count({ where: { userId, correct: true } }),
    db.questionAttempt.groupBy({ by: ["questionId"], where: { userId } }).then((r) => r.length),
    db.testAttempt.count({ where: { userId, status: "COMPLETED" } }),
    db.testAttempt.aggregate({ where: { userId, status: "COMPLETED" }, _avg: { score: true } }),
    db.unitProgress.count({ where: { userId, completedAt: { not: null } } }),
    db.userWord.count({ where: { userId, box: { gte: 4 } } }),
  ]);
  return {
    answered,
    correct,
    accuracy: pct(correct, answered),
    distinct,
    tests,
    avgTestScore: avgScore._avg.score === null ? null : Math.round(avgScore._avg.score),
    units,
    mastered,
  };
}
