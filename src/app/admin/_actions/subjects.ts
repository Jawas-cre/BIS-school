"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { SUBJECT_ICON_KEYS } from "@/components/subject-icon";
import type { ActionState } from "@/components/action-form";
import type { Dict } from "@/lib/i18n/dictionaries";
import { fmt, plural } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";

function subjectInput(t: Dict) {
  return z.object({
    name: z.string().trim().min(2, t.adminSubjects.enterName).max(60),
    description: z.string().trim().max(200).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, t.adminSubjects.pickColor),
    icon: z.string().refine((i) => SUBJECT_ICON_KEYS.includes(i), t.adminSubjects.pickIcon),
    topics: z.string().max(2000).optional(),
  });
}

async function ownSubject(centerId: string, id: string) {
  return db.subject.findFirst({ where: { id, centerId } });
}

export async function createSubject(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const t = await getT();
  const parsed = subjectInput(t).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { topics, ...d } = parsed.data;
  const names = [...new Set((topics ?? "").split("\n").map((t) => t.trim()).filter(Boolean))].slice(0, 40);
  if (names.length === 0) return { error: t.adminSubjects.addOneTopic };
  const last = await db.subject.findFirst({ where: { centerId: staff.centerId }, orderBy: { order: "desc" } });
  await db.subject.create({
    data: {
      ...d,
      description: d.description || null,
      centerId: staff.centerId,
      order: (last?.order ?? 20) + 1,
      topics: { create: names.map((name, i) => ({ name: name.slice(0, 60), order: i })) },
    },
  });
  revalidatePath("/admin/subjects");
  return { ok: fmt(t.adminSubjects.added, { name: d.name, topics: plural(t.adminSubjects.topicCount, names.length) }) };
}

export async function updateSubject(subjectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const t = await getT();
  if (!(await ownSubject(staff.centerId, subjectId))) return { error: t.adminSubjects.onlyOwn };
  const parsed = subjectInput(t).omit({ topics: true }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.subject.update({ where: { id: subjectId }, data: { ...parsed.data, description: parsed.data.description || null } });
  revalidatePath("/admin/subjects");
  return { ok: t.adminSubjects.saved };
}

export async function deleteSubject(subjectId: string) {
  const staff = await requireStaff();
  await db.subject.deleteMany({ where: { id: subjectId, centerId: staff.centerId } });
  revalidatePath("/admin/subjects");
}

export async function addTopic(subjectId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const t = await getT();
  if (!(await ownSubject(staff.centerId, subjectId))) return { error: t.adminSubjects.onlyOwn };
  const name = String(fd.get("name") ?? "").trim().slice(0, 60);
  if (name.length < 2) return { error: t.adminSubjects.enterTopic };
  const last = await db.topic.findFirst({ where: { subjectId }, orderBy: { order: "desc" } });
  await db.topic.create({ data: { subjectId, name, order: (last?.order ?? -1) + 1 } });
  revalidatePath("/admin/subjects");
  return { ok: fmt(t.adminSubjects.topicAdded, { name }) };
}

export async function deleteTopic(topicId: string) {
  const staff = await requireStaff();
  await db.topic.deleteMany({ where: { id: topicId, subject: { centerId: staff.centerId } } });
  revalidatePath("/admin/subjects");
}
