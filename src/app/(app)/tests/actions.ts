"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser, visibleTo } from "@/lib/auth";
import { finalizeAttempt, GRACE_SECONDS, isBreakBoundary, loadAttempt, parseJson, secondsLeft } from "@/lib/tests";

export async function startTest(testId: string) {
  const user = await requireUser();
  const test = await db.test.findFirst({ where: { id: testId, published: true, ...visibleTo(user.centerId) } });
  if (!test) throw new Error("Test not found");
  const open = await db.testAttempt.findFirst({ where: { userId: user.id, testId, status: { in: ["IN_PROGRESS", "BREAK"] } } });
  const attempt = open ?? (await db.testAttempt.create({ data: { userId: user.id, testId, moduleStarted: new Date() } }));
  redirect(`/tests/attempt/${attempt.id}`);
}

async function activeAttempt(attemptId: string) {
  const user = await requireUser();
  const attempt = await loadAttempt(attemptId, user.id);
  if (!attempt) throw new Error("Attempt not found");
  return attempt;
}

export async function saveProgress(attemptId: string, answers: Record<string, string>, flagged: string[]) {
  const attempt = await activeAttempt(attemptId);
  if (attempt.status !== "IN_PROGRESS") return { ok: false as const };
  const mod = attempt.test.modules[attempt.moduleIndex];
  const elapsed = (Date.now() - attempt.moduleStarted.getTime()) / 1000;
  if (!mod || elapsed > mod.minutes * 60 + GRACE_SECONDS) return { ok: false as const };

  // Only the current module's questions can be changed.
  const allowed = new Set(mod.questions.map((q) => q.questionId));
  const merged = parseJson<Record<string, string>>(attempt.answers, {});
  for (const [id, value] of Object.entries(answers)) {
    if (!allowed.has(id)) continue;
    if (value) merged[id] = String(value).slice(0, 12);
    else delete merged[id];
  }
  const keepFlags = parseJson<string[]>(attempt.flagged, []).filter((id) => !allowed.has(id));
  await db.testAttempt.update({
    where: { id: attempt.id },
    data: { answers: JSON.stringify(merged), flagged: JSON.stringify([...keepFlags, ...flagged.filter((id) => allowed.has(id))]) },
  });
  return { ok: true as const };
}

export async function submitModule(attemptId: string, answers: Record<string, string>, flagged: string[]) {
  await saveProgress(attemptId, answers, flagged);
  const attempt = await activeAttempt(attemptId);
  if (attempt.status !== "IN_PROGRESS") return { done: attempt.status === "COMPLETED" };

  if (attempt.moduleIndex < attempt.test.modules.length - 1) {
    await db.testAttempt.update({
      where: { id: attempt.id },
      data: { moduleIndex: attempt.moduleIndex + 1, moduleStarted: new Date(), status: isBreakBoundary(attempt) ? "BREAK" : "IN_PROGRESS" },
    });
    return { done: false };
  }
  await finalizeAttempt(attempt);
  revalidatePath("/tests");
  revalidatePath("/dashboard");
  return { done: true };
}

export async function resumeFromBreak(attemptId: string) {
  const attempt = await activeAttempt(attemptId);
  if (attempt.status === "BREAK") {
    await db.testAttempt.update({ where: { id: attempt.id }, data: { status: "IN_PROGRESS", moduleStarted: new Date() } });
  }
}

/** Server-side guard used when the page loads: an expired module is submitted automatically. */
export async function expireIfNeeded(attemptId: string) {
  const attempt = await activeAttempt(attemptId);
  if (attempt.status === "IN_PROGRESS" && secondsLeft(attempt) === 0) {
    const elapsed = (Date.now() - attempt.moduleStarted.getTime()) / 1000;
    const mod = attempt.test.modules[attempt.moduleIndex];
    if (mod && elapsed > mod.minutes * 60 + GRACE_SECONDS) return submitModule(attemptId, {}, []);
  }
  return null;
}

export async function abandonAttempt(attemptId: string) {
  const attempt = await activeAttempt(attemptId);
  if (attempt.status !== "COMPLETED") await db.testAttempt.delete({ where: { id: attempt.id } });
  revalidatePath("/tests");
  redirect("/tests");
}
