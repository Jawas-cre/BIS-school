import "server-only";
import { db } from "@/lib/db";
import { addDays, dayKey } from "@/lib/utils";

/**
 * Records practice for today: updates the daily activity row, the streak and XP.
 * A streak continues when the previous active day was yesterday.
 */
export async function recordPractice(
  userId: string,
  { questions = 0, correct = 0, minutes = 0, xp = 0 }: { questions?: number; correct?: number; minutes?: number; xp?: number },
) {
  const today = dayKey();
  const user = await db.user.findUnique({ where: { id: userId }, select: { streak: true, bestStreak: true, lastActiveOn: true } });
  if (!user) return;

  let streak = user.streak;
  if (user.lastActiveOn !== today) {
    streak = user.lastActiveOn === addDays(today, -1) ? user.streak + 1 : 1;
  }

  await db.$transaction([
    db.activityDay.upsert({
      where: { userId_day: { userId, day: today } },
      create: { userId, day: today, questions, correct, minutes },
      update: { questions: { increment: questions }, correct: { increment: correct }, minutes: { increment: minutes } },
    }),
    db.user.update({
      where: { id: userId },
      data: {
        streak,
        bestStreak: Math.max(user.bestStreak, streak),
        lastActiveOn: today,
        xp: { increment: xp || correct * 10 + questions * 2 },
      },
    }),
  ]);
}

/** Streak shown to the user: it resets if they missed yesterday. */
export function liveStreak(user: { streak: number; lastActiveOn: string | null }) {
  const today = dayKey();
  if (user.lastActiveOn === today || user.lastActiveOn === addDays(today, -1)) return user.streak;
  return 0;
}
