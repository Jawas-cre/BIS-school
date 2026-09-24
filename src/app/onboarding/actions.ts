"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type OnboardingState = { error?: string } | null;

export async function completeOnboarding(_: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const user = await requireUser();
  const parsed = z
    .object({
      targetScore: z.coerce.number().int().min(400).max(1600),
      examDate: z.string().optional(),
      targetUniId: z.string().optional(),
      branchId: z.string().optional(),
      groupId: z.string().optional(),
      phone: z.string().trim().max(30).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Only accept a branch/group that belongs to the student's own center.
  const [branch, group, uni] = await Promise.all([
    d.branchId ? db.branch.findFirst({ where: { id: d.branchId, centerId: user.centerId ?? "" } }) : null,
    d.groupId ? db.group.findFirst({ where: { id: d.groupId, centerId: user.centerId ?? "" } }) : null,
    d.targetUniId ? db.university.findUnique({ where: { id: d.targetUniId } }) : null,
  ]);

  await db.user.update({
    where: { id: user.id },
    data: {
      targetScore: d.targetScore,
      examDate: d.examDate ? new Date(`${d.examDate}T09:00:00`) : null,
      targetUniId: uni?.id ?? null,
      branchId: branch?.id ?? group?.branchId ?? null,
      groupId: group?.id ?? null,
      phone: d.phone || null,
      onboarded: true,
    },
  });
  redirect("/dashboard?welcome=1");
}
