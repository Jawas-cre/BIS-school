"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { uniqueInviteCode } from "@/lib/invites";
import { dayKey, randomCode } from "@/lib/utils";
import type { ActionState } from "@/components/action-form";
import { fmt } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";

export async function createInviteCode(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireCenterAdmin();
  const t = await getT();
  const C = t.codes;
  const parsed = z
    .object({
      role: z.enum(["STUDENT", "TEACHER"], { message: C.errRole }),
      groupId: z.string().optional(),
      label: z.string().trim().max(60).optional(),
      maxUses: z.union([z.literal(""), z.coerce.number().int().min(1).max(10000)], { message: C.errMaxUses }).optional(),
      expiresOn: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)], { message: C.errDate }).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.expiresOn && d.expiresOn < dayKey()) return { error: C.errDate };

  // Only students join groups; a teacher code ignores the group field.
  const group = d.role === "STUDENT" && d.groupId ? await db.group.findFirst({ where: { id: d.groupId, centerId: admin.centerId } }) : null;
  const code = await uniqueInviteCode();
  await db.inviteCode.create({
    data: {
      centerId: admin.centerId,
      code,
      role: d.role,
      groupId: group?.id ?? null,
      label: d.label || null,
      maxUses: typeof d.maxUses === "number" ? d.maxUses : null,
      // Valid through the end of the chosen day in Tashkent (UTC+5).
      expiresAt: d.expiresOn ? new Date(`${d.expiresOn}T23:59:59+05:00`) : null,
    },
  });
  revalidatePath("/admin/codes");
  return { ok: fmt(C.created, { code, who: d.role === "TEACHER" ? C.whoTeachers : C.whoStudents }) };
}

export async function toggleInviteCode(id: string) {
  const admin = await requireCenterAdmin();
  const invite = await db.inviteCode.findFirst({ where: { id, centerId: admin.centerId } });
  if (invite) await db.inviteCode.update({ where: { id }, data: { active: !invite.active } });
  revalidatePath("/admin/codes");
}

export async function deleteInviteCode(id: string) {
  const admin = await requireCenterAdmin();
  await db.inviteCode.deleteMany({ where: { id, centerId: admin.centerId } });
  revalidatePath("/admin/codes");
}

/** Replaces the center's general student code; the old one stops working. */
export async function regenerateGeneralCode() {
  const admin = await requireCenterAdmin();
  let code = randomCode(6);
  while (await db.center.findUnique({ where: { inviteCode: code } })) code = randomCode(6);
  await db.center.update({ where: { id: admin.centerId }, data: { inviteCode: code } });
  revalidatePath("/admin/codes");
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}
