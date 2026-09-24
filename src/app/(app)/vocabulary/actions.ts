"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, visibleTo } from "@/lib/auth";
import { recordPractice } from "@/lib/activity";

// Leitner intervals (days) for boxes 1..5.
const INTERVALS = [0, 1, 2, 4, 8, 16];

export async function gradeWord(wordId: string, known: boolean) {
  const user = await requireUser();
  const word = await db.vocabWord.findFirst({ where: { id: wordId, deck: visibleTo(user.centerId) } });
  if (!word) throw new Error("Word not found");
  const key = { userId_wordId: { userId: user.id, wordId } };
  const current = await db.userWord.findUnique({ where: key });
  const box = known ? Math.min(5, (current?.box ?? 0) + 1) : 1;
  const nextReview = new Date(Date.now() + INTERVALS[box] * 86_400_000);
  await db.userWord.upsert({ where: key, create: { userId: user.id, wordId, box, nextReview }, update: { box, nextReview } });
  await recordPractice(user.id, { xp: known ? 3 : 1 });
  revalidatePath("/vocabulary");
  return box;
}
