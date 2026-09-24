import "server-only";
import { db } from "@/lib/db";

type Learner = { id: string; centerId: string | null; memberships: { groupId: string }[] };

/**
 * A subject's roadmap for a student: the center's own units for that subject if it
 * has any, otherwise the platform units. A unit is unlocked when it is first, when
 * the previous unit is completed, or when a teacher unlocked it for one of the
 * student's groups.
 */
export async function roadmapFor(user: Learner, subjectId: string) {
  const own = user.centerId ? await db.roadmapUnit.count({ where: { centerId: user.centerId, subjectId } }) : 0;
  const units = await db.roadmapUnit.findMany({
    where: { subjectId, centerId: own > 0 ? user.centerId : null },
    orderBy: { order: "asc" },
    include: { topic: { select: { name: true } } },
  });
  const groupIds = user.memberships.map((m) => m.groupId);
  const [progress, unlocks] = await Promise.all([
    db.unitProgress.findMany({ where: { userId: user.id, unitId: { in: units.map((u) => u.id) } } }),
    groupIds.length ? db.groupUnlock.findMany({ where: { groupId: { in: groupIds }, unitId: { in: units.map((u) => u.id) } } }) : [],
  ]);
  const done = new Map(progress.map((p) => [p.unitId, p]));
  const teacherUnlocked = new Set(unlocks.map((u) => u.unitId));

  return units.map((unit, i) => {
    const p = done.get(unit.id);
    const completed = Boolean(p?.completedAt);
    const unlocked = i === 0 || completed || Boolean(done.get(units[i - 1].id)?.completedAt) || teacherUnlocked.has(unit.id);
    return { ...unit, index: i, completed, unlocked, quizScore: p?.quizScore ?? null, teacherUnlocked: teacherUnlocked.has(unit.id) };
  });
}

export type RoadmapUnitView = Awaited<ReturnType<typeof roadmapFor>>[number];

/** Progress summary across several subjects, plus the next unit to study in each. */
export async function roadmapOverview(user: Learner, subjectIds: string[]) {
  const all = await Promise.all(subjectIds.map(async (id) => ({ subjectId: id, units: await roadmapFor(user, id) })));
  return all.map(({ subjectId, units }) => ({
    subjectId,
    total: units.length,
    done: units.filter((u) => u.completed).length,
    next: units.find((u) => u.unlocked && !u.completed) ?? null,
  }));
}
