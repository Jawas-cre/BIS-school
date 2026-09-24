"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import type { ActionState } from "@/components/action-form";

const UniInput = z.object({
  name: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(60),
  city: z.string().trim().min(1).max(60),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  rank: z.coerce.number().int().min(1).max(1000),
  acceptanceRate: z.coerce.number().min(0).max(100),
  satLow: z.coerce.number().int().min(400).max(1600),
  satHigh: z.coerce.number().int().min(400).max(1600),
  tuition: z.coerce.number().int().min(0),
  aid: z.string().trim().max(200),
  website: z.string().url(),
  about: z.string().trim().max(600),
});

export async function saveUniversity(id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const parsed = UniInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  if (parsed.data.satLow > parsed.data.satHigh) return { error: "The SAT low value must be below the high value" };
  if (id) await db.university.update({ where: { id }, data: parsed.data });
  else await db.university.create({ data: parsed.data });
  revalidatePath("/platform/universities");
  return { ok: "University saved" };
}

export async function deleteUniversity(id: string) {
  await requireSuperAdmin();
  await db.university.delete({ where: { id } });
  revalidatePath("/platform/universities");
}

export async function createPlatformNews(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireSuperAdmin();
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  if (title.length < 3 || body.length < 3) return { error: "Add a title and a message" };
  await db.newsPost.create({ data: { centerId: null, authorId: admin.id, title, body, tag: String(fd.get("tag") || "Update"), pinned: Boolean(fd.get("pinned")) } });
  revalidatePath("/platform/news");
  return { ok: "Published to every center" };
}

export async function deletePlatformNews(id: string) {
  await requireSuperAdmin();
  await db.newsPost.deleteMany({ where: { id, centerId: null } });
  revalidatePath("/platform/news");
}
