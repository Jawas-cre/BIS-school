"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import type { ActionState } from "@/components/action-form";
import { getT } from "@/lib/i18n/server";

/** A free trial lesson request from a center's public website. No account needed. */
export async function submitLead(centerId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const t = await getT();
  const S = t.site;
  // A field people never see: bots that fill in every field are quietly ignored.
  if (String(fd.get("website") ?? "")) return { ok: S.sent };
  const parsed = z
    .object({
      name: z.string().trim().min(2, S.errName).max(80),
      phone: z.string().trim().regex(/^[+\d][\d\s()-]{6,20}$/, S.errPhone),
      course: z.string().trim().max(120).optional(),
      branch: z.string().trim().max(120).optional(),
      time: z.string().trim().max(80).optional(),
      message: z.string().trim().max(500).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!(await db.center.findUnique({ where: { id: centerId }, select: { id: true } }))) return { error: S.errGeneric };
  // At most three requests a day from one phone number.
  const today = await db.lead.count({ where: { centerId, phone: d.phone, createdAt: { gte: new Date(Date.now() - 86_400_000) } } });
  if (today >= 3) return { ok: S.sent };
  await db.lead.create({
    data: { centerId, name: d.name, phone: d.phone, course: d.course || null, branch: d.branch || null, time: d.time || null, message: d.message || null },
  });
  // The number of new requests shows next to Applications in the admin menu.
  revalidatePath("/admin", "layout");
  return { ok: S.sent };
}
