"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { recordPractice } from "@/lib/activity";
import { roadmapFor } from "@/lib/roadmap";
import { isCorrect } from "@/lib/sat";

export const PASS_PERCENT = 60;

export type QuizResult = {
  score: number;
  passed: boolean;
  items: { id: string; response: string; correct: boolean; answer: string; explanation: string }[];
};

async function unlockedUnit(unitId: string) {
  const user = await requireUser();
  const unit = (await roadmapFor(user)).find((u) => u.id === unitId);
  if (!unit || !unit.unlocked) throw new Error("This unit is locked");
  return { user, unit };
}

export async function submitUnitQuiz(unitId: string, responses: Record<string, string>): Promise<QuizResult> {
  const { user, unit } = await unlockedUnit(unitId);
  const ids = Object.keys(responses).slice(0, 10);
  const questions = await db.question.findMany({ where: { id: { in: ids }, skill: unit.skill ?? "" } });

  const items = questions.map((q) => {
    const response = (responses[q.id] ?? "").slice(0, 40);
    return { id: q.id, response, correct: isCorrect(q.type, q.answer, response), answer: q.answer.split("|")[0], explanation: q.explanation };
  });
  const correct = items.filter((i) => i.correct).length;
  const score = items.length ? Math.round((correct / items.length) * 100) : 0;
  const passed = score >= PASS_PERCENT;

  await db.questionAttempt.createMany({
    data: items.map((i) => ({ userId: user.id, questionId: i.id, response: i.response, correct: i.correct, source: "ROADMAP" })),
  });
  const existing = await db.unitProgress.findUnique({ where: { userId_unitId: { userId: user.id, unitId } } });
  await db.unitProgress.upsert({
    where: { userId_unitId: { userId: user.id, unitId } },
    create: { userId: user.id, unitId, quizScore: score, completedAt: passed ? new Date() : null },
    update: {
      quizScore: Math.max(score, existing?.quizScore ?? 0),
      completedAt: existing?.completedAt ?? (passed ? new Date() : null),
    },
  });
  await recordPractice(user.id, { questions: items.length, correct, xp: correct * 10 + items.length * 2 + (passed && !existing?.completedAt ? 50 : 0) });
  revalidatePath("/roadmap");
  revalidatePath("/dashboard");
  return { score, passed, items };
}

export async function markUnitComplete(unitId: string) {
  const { user } = await unlockedUnit(unitId);
  await db.unitProgress.upsert({
    where: { userId_unitId: { userId: user.id, unitId } },
    create: { userId: user.id, unitId, completedAt: new Date() },
    update: { completedAt: new Date() },
  });
  await recordPractice(user.id, { xp: 50 });
  revalidatePath("/roadmap");
}
