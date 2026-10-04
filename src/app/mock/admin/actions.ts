"use server";

import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import type { ActionState } from "@/components/action-form";
import { emptyContent, type MockContent } from "@/lib/mock/format";
import { FILES_DIR, filePath } from "@/lib/mock/files";
import { readContent } from "@/lib/mock/tests";
import { newCandidateNumber, normalizePhone, randomPin } from "@/lib/mock/session";
import { overallBand, speakingBand, SPEAKING_CRITERIA, WRITING_CRITERIA, writingBand, type SpeakingMarks, type WritingMarks } from "@/lib/mock/score";
import { aiMarkWriting } from "@/lib/mock/ai-mark";
import { clearPinFailures } from "@/lib/mock/pin-limit";
import { SAMPLE_CONTENT, SAMPLE_TASK1_IMAGE, SAMPLE_TITLE } from "@/lib/mock/sample";
import { fmt } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";

// CD mock management for center staff (admins and teachers). Deleting tests and candidates is for
// center admins only.

async function ownTest(id: string) {
  const staff = await requireStaff();
  const test = await db.mockTest.findFirst({ where: { id, centerId: staff.centerId } });
  return { staff, test };
}

export async function createMockTest() {
  const staff = await requireStaff();
  const t = await getT();
  const test = await db.mockTest.create({ data: { centerId: staff.centerId, title: t.mockAdmin.untitled, content: JSON.stringify(emptyContent()) } });
  redirect(`/mock/admin/tests/${test.id}`);
}

/** Adds the original sample test (with its Writing chart) to the center, ready to publish. */
export async function addSampleTest() {
  const staff = await requireStaff();
  const content: MockContent = structuredClone(SAMPLE_CONTENT);
  const source = path.join(process.cwd(), SAMPLE_TASK1_IMAGE);
  const size = await stat(source).then((s) => s.size).catch(() => null);
  if (size !== null) {
    const file = await db.mockFile.create({ data: { centerId: staff.centerId, name: "sample-task1.png", mime: "image/png", size } });
    await mkdir(FILES_DIR, { recursive: true });
    await copyFile(source, filePath(file.id));
    content.writing[0].imageId = file.id;
  }
  await db.mockTest.create({ data: { centerId: staff.centerId, title: SAMPLE_TITLE, module: "ACADEMIC", content: JSON.stringify(content), published: true } });
  revalidatePath("/mock/admin/tests");
}

const contentSchema = z.object({
  title: z.string().trim().min(2).max(120),
  module: z.enum(["ACADEMIC", "GENERAL_TRAINING"]),
  content: z.object({
    listening: z.array(z.object({ audioId: z.string().max(40).nullable().optional(), script: z.string().max(40_000).optional(), questions: z.string().max(40_000) })).length(4),
    reading: z.array(z.object({ title: z.string().max(200), text: z.string().max(40_000), labels: z.boolean().optional(), questions: z.string().max(40_000) })).length(3),
    writing: z.array(z.object({ prompt: z.string().max(5_000), imageId: z.string().max(40).nullable().optional(), minWords: z.number().int().min(0).max(1000) })).length(2),
  }),
});

export async function saveMockTest(id: string, json: string): Promise<ActionState> {
  const { staff, test } = await ownTest(id);
  const t = await getT();
  if (!test) return { error: t.common.notFound };
  let data;
  try {
    data = contentSchema.parse(JSON.parse(json));
  } catch {
    return { error: t.mockAdmin.errSave };
  }
  // Only files of this center may be attached.
  const ids = [...data.content.listening.map((p) => p.audioId), ...data.content.writing.map((w) => w.imageId)].filter((x): x is string => !!x);
  const owned = await db.mockFile.count({ where: { id: { in: ids }, centerId: staff.centerId } });
  if (owned !== new Set(ids).size) return { error: t.mockAdmin.errSave };
  await db.mockTest.update({ where: { id }, data: { title: data.title, module: data.module, content: JSON.stringify(data.content) } });
  revalidatePath("/mock/admin/tests");
  return { ok: t.mockAdmin.saved };
}

export async function togglePublished(id: string) {
  const { test } = await ownTest(id);
  if (!test) return;
  await db.mockTest.update({ where: { id }, data: { published: !test.published } });
  revalidatePath("/mock/admin/tests");
}

export async function deleteMockTest(id: string) {
  const { staff, test } = await ownTest(id);
  if (!test || staff.role !== "CENTER_ADMIN") return;
  await db.mockTest.delete({ where: { id } });
  revalidatePath("/mock/admin/tests");
}

/** A copy of a test to edit into a new one. */
export async function duplicateMockTest(id: string) {
  const { staff, test } = await ownTest(id);
  if (!test) return;
  const t = await getT();
  await db.mockTest.create({ data: { centerId: staff.centerId, title: fmt(t.mockAdmin.copyOf, { title: test.title }).slice(0, 120), module: test.module, content: JSON.stringify(readContent(test.content)) } });
  revalidatePath("/mock/admin/tests");
}

export async function createCandidate(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const t = await getT();
  const A = t.mockAdmin;
  const name = String(fd.get("name") ?? "").trim();
  const rawPhone = String(fd.get("phone") ?? "").trim();
  if (name.length < 3 || name.length > 80) return { error: t.mock.errName };
  if (rawPhone && !/^[+\d][\d\s()-]{6,20}$/.test(rawPhone)) return { error: t.mock.errPhone };
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (phone && (await db.mockCandidate.findUnique({ where: { centerId_phone: { centerId: staff.centerId, phone } } }))) return { error: A.errPhoneTaken };
  const pin = randomPin();
  const candidate = await db.mockCandidate.create({
    data: { centerId: staff.centerId, name, phone, number: await newCandidateNumber(), pinHash: await bcrypt.hash(pin, 10) },
  });
  revalidatePath("/mock/admin/candidates");
  return { ok: fmt(A.candidateCreated, { name, number: candidate.number, pin }) };
}

export async function resetCandidatePin(id: string): Promise<ActionState> {
  const staff = await requireStaff();
  const t = await getT();
  const candidate = await db.mockCandidate.findFirst({ where: { id, centerId: staff.centerId } });
  if (!candidate) return { error: t.common.notFound };
  const pin = randomPin();
  await db.mockCandidate.update({ where: { id }, data: { pinHash: await bcrypt.hash(pin, 10) } });
  clearPinFailures(id);
  return { ok: fmt(t.mockAdmin.newPin, { number: candidate.number, pin }) };
}

export async function deleteCandidate(id: string) {
  const staff = await requireStaff();
  if (staff.role !== "CENTER_ADMIN") return;
  await db.mockCandidate.deleteMany({ where: { id, centerId: staff.centerId } });
  revalidatePath("/mock/admin/candidates");
}

/** The examiner's Writing and Speaking marks; with "release", the candidate sees the full report. */
export async function saveMarks(attemptId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const t = await getT();
  const attempt = await db.mockAttempt.findFirst({ where: { id: attemptId, centerId: staff.centerId, section: "DONE" } });
  if (!attempt) return { error: t.common.notFound };
  const num = (name: string) => {
    const v = Number(fd.get(name));
    return Number.isFinite(v) ? Math.min(9, Math.max(0, Math.round(v * 2) / 2)) : NaN;
  };
  const has = (name: string) => String(fd.get(name) ?? "") !== "";
  const task = (prefix: string) => Object.fromEntries(WRITING_CRITERIA.map((c) => [c, num(`${prefix}_${c}`)])) as WritingMarks["t1"];
  const writingComplete = WRITING_CRITERIA.every((c) => has(`t1_${c}`) && has(`t2_${c}`));
  const speakingComplete = SPEAKING_CRITERIA.every((c) => has(`s_${c}`));
  const writingMarks: WritingMarks | null = writingComplete ? { t1: task("t1"), t2: task("t2"), comment: String(fd.get("wComment") ?? "").trim().slice(0, 4000) } : null;
  const speakingMarks: SpeakingMarks | null = speakingComplete
    ? ({ ...Object.fromEntries(SPEAKING_CRITERIA.map((c) => [c, num(`s_${c}`)])), comment: String(fd.get("sComment") ?? "").trim().slice(0, 4000) } as SpeakingMarks)
    : null;
  const wBand = writingMarks ? writingBand(writingMarks) : null;
  const sBand = speakingMarks ? speakingBand(speakingMarks) : null;
  const release = fd.get("release") === "on";
  await db.mockAttempt.update({
    where: { id: attemptId },
    data: {
      writingMarks: writingMarks ? JSON.stringify(writingMarks) : null,
      speakingMarks: speakingMarks ? JSON.stringify(speakingMarks) : null,
      writingBand: wBand,
      speakingBand: sBand,
      overallBand: overallBand([attempt.listeningBand, attempt.readingBand, wBand, sBand]),
      released: release,
    },
  });
  revalidatePath("/mock/admin");
  revalidatePath(`/mock/admin/results/${attemptId}`);
  return { ok: release ? t.mockAdmin.savedReleased : t.mockAdmin.savedDraft };
}

export async function askAiAgain(attemptId: string) {
  const staff = await requireStaff();
  const attempt = await db.mockAttempt.findFirst({ where: { id: attemptId, centerId: staff.centerId, section: "DONE" }, select: { id: true } });
  if (!attempt) return;
  await aiMarkWriting(attempt.id);
  revalidatePath(`/mock/admin/results/${attemptId}`);
}
