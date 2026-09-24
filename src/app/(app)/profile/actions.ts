"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type ProfileState = { error?: string; ok?: string } | null;

export async function updateProfile(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Enter your full name").max(80),
      phone: z.string().trim().max(30).optional(),
      targetScore: z.coerce.number().int().min(400).max(1600).optional(),
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
      targetScore: d.targetScore ?? user.targetScore,
      examDate: d.examDate ? new Date(`${d.examDate}T09:00:00`) : null,
      targetUniId: uni?.id ?? null,
    },
  });
  revalidatePath("/", "layout");
  return { ok: "Profile saved" };
}

export async function changePassword(_: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireUser();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8) return { error: "New password must be at least 8 characters" };
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Current password is incorrect" };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: "Password changed" };
}
