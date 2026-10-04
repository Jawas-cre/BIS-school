"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/components/action-form";
import { createMockSession, deleteMockSession, newCandidateNumber, normalizePhone, requireCandidate } from "@/lib/mock/session";
import { clearPinFailures, pinBlocked, pinFailed } from "@/lib/mock/pin-limit";
import { getT } from "@/lib/i18n/server";

const PIN = /^\d{4,8}$/;
/** Compared against when no account matches, so a wrong number takes as long as a wrong PIN. */
const NO_ACCOUNT = bcrypt.hashSync("no account", 10);

export async function registerCandidate(centerId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const M = t.mock;
  const parsed = z
    .object({
      name: z.string().trim().min(3, M.errName).max(80),
      phone: z.string().trim().regex(/^[+\d][\d\s()-]{6,20}$/, M.errPhone),
      pin: z.string().regex(PIN, M.errPin),
      pin2: z.string(),
    })
    .safeParse({ name: fd.get("name") ?? "", phone: fd.get("phone") ?? "", pin: fd.get("pin") ?? "", pin2: fd.get("pin2") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.pin !== d.pin2) return { error: M.errPinRepeat };
  const center = await db.center.findUnique({ where: { id: centerId }, select: { id: true } });
  if (!center) return { error: t.common.somethingWrong };
  const phone = normalizePhone(d.phone);
  if (await db.mockCandidate.findUnique({ where: { centerId_phone: { centerId, phone } } })) return { error: M.errPhoneTaken };
  const candidate = await db.mockCandidate.create({
    data: { centerId, name: d.name, phone, number: await newCandidateNumber(), pinHash: await bcrypt.hash(d.pin, 10) },
  });
  await createMockSession(candidate);
  redirect("/mock/home?welcome=1");
}

export async function loginCandidate(centerId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const login = String(fd.get("login") ?? "").trim();
  const pin = String(fd.get("pin") ?? "");
  if (!login || !pin) return { error: t.mock.errLogin };
  // Six digits is a candidate number; anything else is a phone number.
  const found = /^\d{6}$/.test(login)
    ? await db.mockCandidate.findUnique({ where: { number: login } })
    : await db.mockCandidate.findUnique({ where: { centerId_phone: { centerId, phone: normalizePhone(login) } } });
  const candidate = found?.centerId === centerId ? found : null;
  const limitKey = candidate ? candidate.id : `${centerId}:${login.replace(/\D/g, "")}`;
  if (pinBlocked(limitKey)) return { error: t.mock.errTooMany };
  const ok = await bcrypt.compare(pin, candidate?.pinHash ?? NO_ACCOUNT);
  if (!candidate || !ok) {
    pinFailed(limitKey);
    return { error: t.mock.errLogin };
  }
  clearPinFailures(limitKey);
  await createMockSession(candidate);
  redirect("/mock/home");
}

export async function logoutCandidate() {
  await deleteMockSession();
  redirect("/mock");
}

/** Starts a test, or continues the candidate's unfinished attempt at it. */
export async function startMockTest(testId: string) {
  const candidate = await requireCandidate();
  const test = await db.mockTest.findFirst({ where: { id: testId, centerId: candidate.centerId, published: true }, select: { id: true } });
  if (!test) redirect("/mock/home");
  const open = await db.mockAttempt.findFirst({ where: { testId, candidateId: candidate.id, section: { not: "DONE" } }, select: { id: true } });
  const attempt = open ?? (await db.mockAttempt.create({ data: { testId, candidateId: candidate.id, centerId: candidate.centerId } }));
  redirect(`/mock/exam/${attempt.id}`);
}
