"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff, staffGroups } from "@/lib/auth";
import { revalidatePanels } from "@/lib/panel";
import { STATUSES } from "@/lib/journal";
import { dayKey } from "@/lib/utils";
import type { ActionState } from "@/components/action-form";
import { fmt } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";

/** Saves one lesson of a group: the topic, and each student's attendance and optional 1–5 grade. */
export async function saveLesson(groupId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const t = await getT();
  const J = t.journal;
  const group = await db.group.findFirst({ where: { id: groupId, ...staffGroups(staff) }, include: { members: { select: { userId: true } } } });
  if (!group) return { error: t.adminGroups.notFound };
  const parsed = z
    .object({
      day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, J.errDay),
      topic: z.string().trim().max(120).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { day, topic } = parsed.data;
  if (day > dayKey()) return { error: J.errFuture };

  const marks = group.members.map(({ userId }) => {
    const status = String(fd.get(`status_${userId}`) ?? "");
    const grade = Number(fd.get(`grade_${userId}`) || 0);
    return {
      userId,
      status: (STATUSES as readonly string[]).includes(status) ? status : "PRESENT",
      grade: Number.isInteger(grade) && grade >= 1 && grade <= 5 ? grade : null,
    };
  });

  const lesson = await db.lesson.upsert({
    where: { groupId_day: { groupId, day } },
    create: { groupId, day, topic: topic || null },
    update: { topic: topic || null },
  });
  await db.$transaction(
    marks.map((m) =>
      db.attendance.upsert({
        where: { lessonId_userId: { lessonId: lesson.id, userId: m.userId } },
        create: { lessonId: lesson.id, ...m },
        update: { status: m.status, grade: m.grade },
      }),
    ),
  );
  revalidatePanels(`/groups/${groupId}`);
  return { ok: fmt(J.saved, { n: marks.length }) };
}

export async function deleteLesson(groupId: string, lessonId: string) {
  const staff = await requireStaff();
  await db.lesson.deleteMany({ where: { id: lessonId, group: { id: groupId, ...staffGroups(staff) } } });
  revalidatePanels(`/groups/${groupId}`);
}
