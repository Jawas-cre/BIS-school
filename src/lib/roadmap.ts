import "server-only";
import { db } from "@/lib/db";

/**
 * The roadmap a user sees: their center's own units if it has any, otherwise the
 * platform default. Each unit is unlocked when it is first, when the previous
 * unit is completed, or when the student's teacher has unlocked it for the group.
 */
export async function roadmapFor(user: { id: string; centerId: string | null; groupId: string | null }) {
  const own = user.centerId ? await db.roadmapUnit.count({ where: { centerId: user.centerId } }) : 0;
  const units = await db.roadmapUnit.findMany({
    where: { centerId: own > 0 ? user.centerId : null },
    orderBy: { order: "asc" },
  });
  const [progress, unlocks] = await Promise.all([
    db.unitProgress.findMany({ where: { userId: user.id, unitId: { in: units.map((u) => u.id) } } }),
    user.groupId ? db.groupUnlock.findMany({ where: { groupId: user.groupId } }) : [],
  ]);
  const done = new Map(progress.map((p) => [p.unitId, p]));
  const teacherUnlocked = new Set(unlocks.map((u) => u.unitId));

  return units.map((unit, i) => {
    const p = done.get(unit.id);
    const completed = Boolean(p?.completedAt);
    const unlocked = i === 0 || completed || Boolean(done.get(units[i - 1].id)?.completedAt) || teacherUnlocked.has(unit.id);
    return { ...unit, completed, unlocked, quizScore: p?.quizScore ?? null, teacherUnlocked: teacherUnlocked.has(unit.id) };
  });
}

export async function nextUnitFor(user: { id: string; centerId: string | null; groupId: string | null }) {
  const units = await roadmapFor(user);
  return units.find((u) => u.unlocked && !u.completed) ?? null;
}
