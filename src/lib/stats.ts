import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { TAXONOMY, type Section } from "@/lib/sat";
import { addDays, dayKey, pct } from "@/lib/utils";

type Row = { section: string; key: string; total: bigint | number; correct: bigint | number };

/** Answer counts per domain (or skill) for a set of users. Works on SQLite and Postgres. */
export async function accuracyBy(userIds: string[], by: "domain" | "skill") {
  if (userIds.length === 0) return new Map<string, { total: number; correct: number }>();
  const column = by === "domain" ? Prisma.sql`q."domain"` : Prisma.sql`q."skill"`;
  const rows = await db.$queryRaw<Row[]>`
    SELECT q."section" AS section, ${column} AS key,
           COUNT(*) AS total,
           SUM(CASE WHEN a."correct" THEN 1 ELSE 0 END) AS correct
    FROM "QuestionAttempt" a
    JOIN "Question" q ON q."id" = a."questionId"
    WHERE a."userId" IN (${Prisma.join(userIds)})
    GROUP BY q."section", ${column}`;
  return new Map(rows.map((r) => [r.key, { total: Number(r.total), correct: Number(r.correct) }]));
}

export async function domainComparison(userId: string, groupPeerIds: string[]) {
  const [mine, group] = await Promise.all([accuracyBy([userId], "domain"), accuracyBy(groupPeerIds, "domain")]);
  return (Object.keys(TAXONOMY) as Section[]).flatMap((section) =>
    TAXONOMY[section].map(({ domain }) => {
      const m = mine.get(domain);
      const g = group.get(domain);
      return {
        section: section === "RW" ? "Reading & Writing" : "Math",
        domain,
        you: m?.total ? pct(m.correct, m.total) : null,
        group: g?.total ? pct(g.correct, g.total) : null,
        attempts: m?.total ?? 0,
      };
    }),
  );
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
  const [answered, correct, distinct, tests, units, mastered] = await Promise.all([
    db.questionAttempt.count({ where: { userId } }),
    db.questionAttempt.count({ where: { userId, correct: true } }),
    db.questionAttempt.groupBy({ by: ["questionId"], where: { userId } }).then((r) => r.length),
    db.testAttempt.count({ where: { userId, status: "COMPLETED" } }),
    db.unitProgress.count({ where: { userId, completedAt: { not: null } } }),
    db.userWord.count({ where: { userId, box: { gte: 4 } } }),
  ]);
  return { answered, correct, accuracy: pct(correct, answered), distinct, tests, units, mastered };
}
