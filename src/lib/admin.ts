import "server-only";
import { db } from "@/lib/db";
import { addDays, dayKey, pct } from "@/lib/utils";

export type StudentRow = Awaited<ReturnType<typeof centerStudents>>[number];

/** Students in a center (optionally one group, or one teacher's groups) with the numbers staff care about. */
export async function centerStudents(centerId: string, opts: { groupId?: string; teacherId?: string } = {}) {
  const inGroups = opts.groupId || opts.teacherId;
  const students = await db.user.findMany({
    where: {
      centerId,
      role: "STUDENT",
      ...(inGroups ? { memberships: { some: { ...(opts.groupId ? { groupId: opts.groupId } : {}), ...(opts.teacherId ? { group: { teacherId: opts.teacherId } } : {}) } } } : {}),
    },
    orderBy: { name: "asc" },
    include: {
      memberships: { include: { group: { select: { id: true, name: true, subject: { select: { name: true, color: true } } } } } },
      branch: { select: { name: true } },
    },
  });
  const ids = students.map((s) => s.id);
  const [answers, correct, tests, week] = await Promise.all([
    db.questionAttempt.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _count: true }),
    db.questionAttempt.groupBy({ by: ["userId"], where: { userId: { in: ids }, correct: true }, _count: true }),
    db.testAttempt.groupBy({ by: ["userId"], where: { userId: { in: ids }, status: "COMPLETED" }, _avg: { score: true }, _count: true }),
    db.activityDay.groupBy({ by: ["userId"], where: { userId: { in: ids }, day: { gte: addDays(dayKey(), -6) } }, _sum: { questions: true } }),
  ]);
  const total = new Map(answers.map((a) => [a.userId, a._count]));
  const right = new Map(correct.map((a) => [a.userId, a._count]));
  const testAvg = new Map(tests.map((t) => [t.userId, { avg: t._avg.score, count: t._count }]));
  const weekly = new Map(week.map((w) => [w.userId, w._sum.questions ?? 0]));
  const today = dayKey();

  return students.map((s) => {
    const answered = total.get(s.id) ?? 0;
    const active = s.lastActiveOn === today || s.lastActiveOn === addDays(today, -1);
    const t = testAvg.get(s.id);
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      grade: s.grade,
      groups: s.memberships.map((m) => m.group),
      branch: s.branch?.name ?? null,
      avgTest: t?.avg == null ? null : Math.round(t.avg),
      testsTaken: t?.count ?? 0,
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
