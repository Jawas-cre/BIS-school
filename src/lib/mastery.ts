import "server-only";
import { db } from "@/lib/db";

// Topic mastery in the style of Khan Academy: a level per topic from the student's latest answers on
// it (practice, tests and roadmap quizzes), and a subject mastery percentage from mastery points.
export const LEVELS = ["NOT_STARTED", "ATTEMPTED", "FAMILIAR", "PROFICIENT", "MASTERED"] as const;
export type MasteryLevel = (typeof LEVELS)[number];

const POINTS: Record<MasteryLevel, number> = { NOT_STARTED: 0, ATTEMPTED: 0, FAMILIAR: 50, PROFICIENT: 80, MASTERED: 100 };
/** How many of the latest answers on a topic decide its level. */
const WINDOW = 10;

/** The level from the latest answers on a topic (newest first). */
export function levelFor(latest: boolean[]): MasteryLevel {
  const n = latest.length;
  if (n === 0) return "NOT_STARTED";
  const accuracy = latest.filter(Boolean).length / n;
  if (n >= 6 && accuracy >= 0.9) return "MASTERED";
  if (n >= 4 && accuracy >= 0.7) return "PROFICIENT";
  if (accuracy >= 0.5) return "FAMILIAR";
  return "ATTEMPTED";
}

/** Each student's level on each topic: Map<userId, Map<topicId, level>>. Topics never answered are NOT_STARTED. */
export async function topicMastery(userIds: string[], topicIds: string[]) {
  const attempts =
    userIds.length && topicIds.length
      ? await db.questionAttempt.findMany({
          where: { userId: { in: userIds }, question: { topicId: { in: topicIds } } },
          orderBy: { createdAt: "desc" },
          select: { userId: true, correct: true, question: { select: { topicId: true } } },
        })
      : [];
  const latest = new Map<string, boolean[]>();
  for (const a of attempts) {
    const key = `${a.userId}:${a.question.topicId}`;
    const list = latest.get(key) ?? [];
    if (list.length < WINDOW) list.push(a.correct);
    latest.set(key, list);
  }
  return new Map(userIds.map((u) => [u, new Map(topicIds.map((t) => [t, levelFor(latest.get(`${u}:${t}`) ?? [])]))]));
}

/** Mastery percentage over some topics: the average of their mastery points. */
export function masteryPercent(levels: Map<string, MasteryLevel> | undefined, topicIds: string[]) {
  if (!levels || topicIds.length === 0) return 0;
  return Math.round(topicIds.reduce((sum, t) => sum + POINTS[levels.get(t) ?? "NOT_STARTED"], 0) / topicIds.length);
}
