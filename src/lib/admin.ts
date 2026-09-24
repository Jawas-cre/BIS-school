import "server-only";
import { db } from "@/lib/db";
import { addDays, dayKey, pct } from "@/lib/utils";

export type StudentRow = Awaited<ReturnType<typeof centerStudents>>[number];

/** Every student in a center with the numbers staff care about. */
export async function centerStudents(centerId: string, where: { groupId?: string } = {}) {
  const students = await db.user.findMany({
    where: { centerId, role: "STUDENT", ...where },
    orderBy: { name: "asc" },
    include: { group: { select: { id: true, name: true } }, branch: { select: { name: true } } },
  });
  const ids = students.map((s) => s.id);
  const [answers, correct, attempts, week] = await Promise.all([
    db.questionAttempt.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _count: true }),
    db.questionAttempt.groupBy({ by: ["userId"], where: { userId: { in: ids }, correct: true }, _count: true }),
    db.testAttempt.findMany({
      where: { userId: { in: ids }, status: "COMPLETED", totalScore: { not: null } },
      orderBy: { finishedAt: "desc" },
      select: { userId: true, totalScore: true },
    }),
    db.activityDay.groupBy({ by: ["userId"], where: { userId: { in: ids }, day: { gte: addDays(dayKey(), -6) } }, _sum: { questions: true } }),
  ]);
  const total = new Map(answers.map((a) => [a.userId, a._count]));
  const right = new Map(correct.map((a) => [a.userId, a._count]));
  const latest = new Map<string, number>();
  for (const a of attempts) if (!latest.has(a.userId)) latest.set(a.userId, a.totalScore!);
  const weekly = new Map(week.map((w) => [w.userId, w._sum.questions ?? 0]));
  const today = dayKey();

  return students.map((s) => {
    const answered = total.get(s.id) ?? 0;
    const active = s.lastActiveOn === today || s.lastActiveOn === addDays(today, -1);
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      group: s.group,
      branch: s.branch?.name ?? null,
      targetScore: s.targetScore,
      latestScore: latest.get(s.id) ?? null,
      answered,
      accuracy: answered ? pct(right.get(s.id) ?? 0, answered) : null,
      weekQuestions: weekly.get(s.id) ?? 0,
      streak: active ? s.streak : 0,
      lastActiveOn: s.lastActiveOn,
      xp: s.xp,
    };
  });
}

export function average(values: (number | null)[]) {
  const v = values.filter((x): x is number => x !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}
