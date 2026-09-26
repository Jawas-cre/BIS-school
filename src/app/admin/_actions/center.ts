"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { randomCode } from "@/lib/utils";
import type { ActionState } from "@/components/action-form";
import { getT } from "@/lib/i18n/server";

export async function updateCenter(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireCenterAdmin();
  const t = await getT();
  const parsed = z
    .object({
      name: z.string().trim().min(2, t.settings.enterCenterName).max(80),
      city: z.string().trim().max(60).optional(),
      about: z.string().trim().max(400).optional(),
      accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, t.settings.pickColor),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.center.update({ where: { id: admin.centerId }, data: { ...parsed.data, city: parsed.data.city || null, about: parsed.data.about || null } });
  revalidatePath("/", "layout");
  return { ok: t.settings.saved };
}

export async function regenerateInvite() {
  const admin = await requireCenterAdmin();
  await db.center.update({ where: { id: admin.centerId }, data: { inviteCode: randomCode(6) } });
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export async function createBranch(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireCenterAdmin();
  const t = await getT();
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { error: t.settings.enterBranchName };
  await db.branch.create({
    data: { centerId: admin.centerId, name, address: String(fd.get("address") ?? "").trim() || null, phone: String(fd.get("phone") ?? "").trim() || null },
  });
  revalidatePath("/admin/settings");
  return { ok: t.settings.branchAdded };
}

export async function deleteBranch(branchId: string) {
  const admin = await requireCenterAdmin();
  await db.branch.deleteMany({ where: { id: branchId, centerId: admin.centerId } });
  revalidatePath("/admin/settings");
}
