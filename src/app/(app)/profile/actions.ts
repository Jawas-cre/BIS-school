"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export type ProfileState = { error?: string; ok?: string } | null;

export async function updateProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const t = await getT();
  const parsed = z
    .object({
      name: z.string().trim().min(2, t.validation.fullName).max(80),
      phone: z.string().trim().max(30).optional(),
      grade: z.string().trim().max(40).optional(),
      goal: z.string().trim().max(160).optional(),
      examDate: z.string().optional(),
      targetUniId: z.string().optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const uni = d.targetUniId ? await db.university.findUnique({ where: { id: d.targetUniId } }) : null;
  await db.user.update({
    where: { id: user.id },
    data: {
      name: d.name,
      phone: d.phone || null,
      grade: d.grade || null,
      goal: d.goal || null,
      examDate: d.examDate ? new Date(`${d.examDate}T09:00:00`) : null,
      targetUniId: uni?.id ?? null,
    },
  });
  revalidatePath("/", "layout");
  return { ok: t.profile.saved };
}

export async function changePassword(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const t = await getT();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: t.validation.passwordMin };
  if (formData.has("confirm") && formData.get("confirm") !== next) return { error: t.validation.passwordsDiffer };
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: t.profile.currentIncorrect };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: t.profile.passwordChanged };
}
