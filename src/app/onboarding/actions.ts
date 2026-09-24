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
      grade: z.string().trim().max(40).optional(),
      goal: z.string().trim().max(160).optional(),
      examDate: z.string().optional(),
      targetUniId: z.string().optional(),
      branchId: z.string().optional(),
      phone: z.string().trim().max(30).optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const centerId = user.centerId ?? "";
  const groupIds = formData.getAll("groupIds").map(String);

  // Only accept a branch and groups that belong to the student's own center.
  const [branch, groups, uni] = await Promise.all([
    d.branchId ? db.branch.findFirst({ where: { id: d.branchId, centerId } }) : null,
    groupIds.length ? db.group.findMany({ where: { id: { in: groupIds }, centerId } }) : [],
    d.targetUniId ? db.university.findUnique({ where: { id: d.targetUniId } }) : null,
  ]);

  await db.$transaction([
    db.user.update({
      where: { id: user.id },
      data: {
        grade: d.grade || null,
        goal: d.goal || null,
        examDate: d.examDate ? new Date(`${d.examDate}T09:00:00`) : null,
        targetUniId: uni?.id ?? null,
        branchId: branch?.id ?? groups[0]?.branchId ?? null,
        phone: d.phone || null,
        onboarded: true,
      },
    }),
    ...groups.map((g) =>
      db.groupMember.upsert({ where: { groupId_userId: { groupId: g.id, userId: user.id } }, create: { groupId: g.id, userId: user.id }, update: {} }),
    ),
  ]);
  redirect("/dashboard?welcome=1");
}
