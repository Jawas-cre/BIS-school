import "server-only";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/utils";

// Work a teacher sets for a group: take a mock test, finish a roadmap unit, or answer a number of
// practice questions on a topic — each by a due day. Completion is worked out from what students did.
export const KINDS = ["TEST", "UNIT", "PRACTICE"] as const;
export type AssignmentKind = (typeof KINDS)[number];

type Checkable = { id: string; kind: string; testId: string | null; unitId: string | null; topicId: string | null; questions: number | null; createdAt: Date };
export type Progress = { done: boolean; score: number | null; answered: number };

/** Map<assignmentId, Map<userId, Progress>> for some assignments and students. */
export async function assignmentProgress(assignments: Checkable[], userIds: string[]) {
  const testIds = assignments.flatMap((a) => (a.kind === "TEST" && a.testId ? [a.testId] : []));
  const unitIds = assignments.flatMap((a) => (a.kind === "UNIT" && a.unitId ? [a.unitId] : []));
  const practice = assignments.filter((a) => a.kind === "PRACTICE" && a.topicId);
  const since = practice.length ? new Date(Math.min(...practice.map((a) => a.createdAt.getTime()))) : null;
  const none = { in: [] as string[] };
  const [tests, units, answers] = userIds.length
    ? await Promise.all([
        testIds.length
          ? db.testAttempt.findMany({ where: { userId: { in: userIds }, testId: { in: testIds }, status: "COMPLETED" }, select: { userId: true, testId: true, finishedAt: true, score: true } })
          : [],
        unitIds.length ? db.unitProgress.findMany({ where: { userId: { in: userIds }, unitId: { in: unitIds }, completedAt: { not: null } }, select: { userId: true, unitId: true } }) : [],
        since
          ? db.questionAttempt.findMany({
              where: { userId: { in: userIds }, createdAt: { gte: since }, question: { topicId: practice.length ? { in: practice.map((a) => a.topicId!) } : none } },
              select: { userId: true, createdAt: true, question: { select: { topicId: true } } },
            })
          : [],
      ])
    : [[], [], []];

  const out = new Map<string, Map<string, Progress>>();
  for (const a of assignments) {
    const perUser = new Map<string, Progress>();
    for (const u of userIds) {
      if (a.kind === "TEST") {
        const best = tests.filter((x) => x.userId === u && x.testId === a.testId && x.finishedAt && x.finishedAt >= a.createdAt).sort((x, y) => (y.score ?? 0) - (x.score ?? 0))[0];
        perUser.set(u, { done: Boolean(best), score: best?.score ?? null, answered: 0 });
      } else if (a.kind === "UNIT") {
        perUser.set(u, { done: units.some((x) => x.userId === u && x.unitId === a.unitId), score: null, answered: 0 });
      } else {
        const answered = answers.filter((x) => x.userId === u && x.question.topicId === a.topicId && x.createdAt >= a.createdAt).length;
        perUser.set(u, { done: answered >= (a.questions ?? 1), score: null, answered });
      }
    }
    out.set(a.id, perUser);
  }
  return out;
}

/** Due, overdue (due day passed, not done) or done. */
export function assignmentState(dueOn: string, done: boolean) {
  if (done) return "done" as const;
  return dueOn < dayKey() ? ("overdue" as const) : ("due" as const);
}

/** Where a student goes to do an assignment. */
export function assignmentHref(a: { kind: string; testId: string | null; unitId: string | null; topicId: string | null; topic?: { subjectId: string } | null }) {
  if (a.kind === "TEST" && a.testId) return `/tests/${a.testId}`;
  if (a.kind === "UNIT" && a.unitId) return `/roadmap/${a.unitId}`;
  if (a.kind === "PRACTICE" && a.topicId && a.topic) return `/questions?subject=${a.topic.subjectId}&topic=${a.topicId}`;
  return "/assignments";
}

/** A student's assignments from all their groups, with their own progress. */
export async function studentAssignments(userId: string, groupIds: string[]) {
  const assignments = groupIds.length
    ? await db.assignment.findMany({
        where: { groupId: { in: groupIds } },
        orderBy: [{ dueOn: "asc" }, { createdAt: "asc" }],
        include: { group: { select: { name: true } }, topic: { select: { subjectId: true, name: true } } },
      })
    : [];
  const progress = await assignmentProgress(assignments, [userId]);
  return assignments.map((a) => {
    const p = progress.get(a.id)!.get(userId)!;
    return { ...a, progress: p, state: assignmentState(a.dueOn, p.done), href: assignmentHref(a) };
  });
}
