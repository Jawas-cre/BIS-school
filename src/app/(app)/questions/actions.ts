"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, visibleTo } from "@/lib/auth";
import { recordPractice } from "@/lib/activity";
import { isCorrect } from "@/lib/quiz";

export type CheckResult = { correct: boolean; answer: string; explanation: string };

export async function checkAnswer(questionId: string, response: string, seconds: number): Promise<CheckResult> {
  const user = await requireUser();
  const q = await db.question.findFirst({ where: { id: questionId, ...visibleTo(user.centerId) } });
  if (!q) throw new Error("Question not found");
  const correct = isCorrect(q.type, q.answer, response);
  await db.questionAttempt.create({
    data: { userId: user.id, questionId, response: response.slice(0, 60), correct, seconds: Math.max(0, Math.min(3600, Math.round(seconds))), source: "BANK" },
  });
  await recordPractice(user.id, { questions: 1, correct: correct ? 1 : 0, minutes: Math.round(seconds / 60) });
  revalidatePath("/questions");
  return { correct, answer: q.answer.split("|")[0], explanation: q.explanation };
}

export async function toggleBookmark(questionId: string) {
  const user = await requireUser();
  const key = { userId_questionId: { userId: user.id, questionId } };
  const existing = await db.bookmark.findUnique({ where: key });
  if (existing) await db.bookmark.delete({ where: key });
  else await db.bookmark.create({ data: { userId: user.id, questionId } });
  revalidatePath("/questions");
  return !existing;
}
