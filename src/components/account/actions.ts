"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { ActionState } from "@/components/action-form";
import { getT } from "@/lib/i18n/server";

/** Name, login email and phone for staff and the platform owner. */
export async function updateAccount(_: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireUser();
  const t = await getT();
  const parsed = z
    .object({
      name: z.string().trim().min(2, t.validation.fullName).max(80),
      email: z.string().trim().toLowerCase().email(t.validation.email),
      phone: z.string().trim().max(30).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.email !== user.email && (await db.user.findUnique({ where: { email: d.email } }))) return { error: t.auth.emailTaken };
  await db.user.update({ where: { id: user.id }, data: { name: d.name, email: d.email, phone: d.phone || null } });
  revalidatePath("/", "layout");
  return { ok: t.account.saved };
}
