"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff, staffGroups, visibleTo } from "@/lib/auth";
import { revalidatePanels } from "@/lib/panel";
import { KINDS } from "@/lib/assignments";
import { dayKey } from "@/lib/utils";
import type { ActionState } from "@/components/action-form";
import { fmt } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";

/** Sets work for a group: a mock test, a roadmap unit, or a number of practice questions on a topic. */
export async function createAssignment(groupId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const t = await getT();
  const A = t.assignments;
  const group = await db.group.findFirst({ where: { id: groupId, ...staffGroups(staff) } });
  if (!group) return { error: t.adminGroups.notFound };
  const parsed = z
    .object({
      kind: z.enum(KINDS, { message: A.errKind }),
      testId: z.string().optional(),
      unitId: z.string().optional(),
      topicId: z.string().optional(),
      questions: z.coerce.number().int().min(1, A.errQuestions).max(100, A.errQuestions).optional(),
      title: z.string().trim().max(120).optional(),
      note: z.string().trim().max(300).optional(),
      dueOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, A.errDue),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.dueOn < dayKey()) return { error: A.errDue };

  const visible = visibleTo(staff.centerId);
  let data: { testId?: string; unitId?: string; topicId?: string; questions?: number; title: string };
  if (d.kind === "TEST") {
    const test = d.testId ? await db.test.findFirst({ where: { id: d.testId, ...visible } }) : null;
    if (!test) return { error: A.errChooseTest };
    data = { testId: test.id, title: d.title || test.title };
  } else if (d.kind === "UNIT") {
    const unit = d.unitId ? await db.roadmapUnit.findFirst({ where: { id: d.unitId, ...visible } }) : null;
    if (!unit) return { error: A.errChooseUnit };
    data = { unitId: unit.id, title: d.title || unit.title };
  } else {
    const topic = d.topicId ? await db.topic.findFirst({ where: { id: d.topicId, subject: visible } }) : null;
    if (!topic) return { error: A.errChooseTopic };
    const questions = d.questions ?? 10;
    data = { topicId: topic.id, questions, title: d.title || fmt(A.practiceTitle, { topic: topic.name, n: questions }) };
  }
  await db.assignment.create({ data: { groupId, kind: d.kind, dueOn: d.dueOn, note: d.note || null, createdById: staff.id, ...data } });
  revalidatePanels(`/groups/${groupId}`);
  revalidatePath("/assignments");
  return { ok: fmt(A.created, { title: data.title }) };
}

export async function deleteAssignment(groupId: string, id: string) {
  const staff = await requireStaff();
  await db.assignment.deleteMany({ where: { id, group: { id: groupId, ...staffGroups(staff) } } });
  revalidatePanels(`/groups/${groupId}`);
  revalidatePath("/assignments");
}
