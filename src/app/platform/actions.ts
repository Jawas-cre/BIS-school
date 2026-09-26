"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import type { ActionState } from "@/components/action-form";
import type { Dict } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";

const uniInput = (t: Dict) => z.object({
  name: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(60),
  city: z.string().trim().min(1).max(60),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  rank: z.coerce.number().int().min(1).max(1000),
  acceptanceRate: z.union([z.literal("").transform(() => null), z.coerce.number().min(0).max(100)]),
  tuition: z.union([z.literal("").transform(() => null), z.coerce.number().int().min(0)]),
  requirements: z.string().trim().min(3).max(600),
  aid: z.string().trim().max(200),
  website: z.string().trim().url().refine((u) => /^https?:\/\//i.test(u), t.platform.httpLink),
  about: z.string().trim().max(600),
});

export async function saveUniversity(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const t = await getT();
  const parsed = uniInput(t).safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const key = String(parsed.error.issues[0].path[0] ?? "");
    const field = key in t.platform.fields ? t.platform.fields[key as keyof typeof t.platform.fields] : key;
    return { error: fmt(t.platform.checkField, { field }) };
  }
  if (id) await db.university.update({ where: { id }, data: parsed.data });
  else await db.university.create({ data: parsed.data });
  revalidatePath("/platform/universities");
  return { ok: t.platform.uniSaved };
}

export async function deleteUniversity(id: string) {
  await requireSuperAdmin();
  await db.university.delete({ where: { id } });
  revalidatePath("/platform/universities");
}

export async function createPlatformNews(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireSuperAdmin();
  const t = await getT();
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (title.length < 3 || body.length < 3) return { error: t.platform.errNews };
  await db.newsPost.create({ data: { centerId: null, authorId: admin.id, title, body, tag: String(fd.get("tag") || "Update"), pinned: Boolean(fd.get("pinned")) } });
  revalidatePath("/platform/news");
  return { ok: t.platform.newsPublished };
}

export async function deletePlatformNews(id: string) {
  await requireSuperAdmin();
  await db.newsPost.deleteMany({ where: { id, centerId: null } });
  revalidatePath("/platform/news");
}
