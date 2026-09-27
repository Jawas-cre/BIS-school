"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { LEAD_STATUSES, SITE_KINDS, type LeadStatus, type SiteKind } from "@/lib/site";
import type { ActionState } from "@/components/action-form";
import { getT } from "@/lib/i18n/server";

const PHONE = /^[+\d][\d\s()-]{6,20}$/;
// A username (@name), a t.me / instagram.com address, or a full link.
const SOCIAL = /^(https?:\/\/\S+|@?[\w.]{2,64}|(www\.)?(t\.me|instagram\.com)\/[\w.]+\/?)$/i;

/** The website shows on /c/<slug> and, on a copy with an owner, on the home page. */
async function revalidateSite(centerId: string) {
  const center = await db.center.findUnique({ where: { id: centerId }, select: { slug: true } });
  if (center) revalidatePath(`/c/${center.slug}`);
  revalidatePath("/");
  revalidatePath("/admin/website");
}

export async function updateSite(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireCenterAdmin();
  const t = await getT();
  const W = t.siteAdmin;
  const parsed = z
    .object({
      heroTitle: z.string().trim().max(120),
      heroText: z.string().trim().max(600),
      phone: z.string().trim().max(30).refine((v) => !v || PHONE.test(v), W.errPhone),
      telegram: z.string().trim().max(120).refine((v) => !v || SOCIAL.test(v), W.errSocial),
      instagram: z.string().trim().max(120).refine((v) => !v || SOCIAL.test(v), W.errSocial),
    })
    .safeParse({
      heroTitle: fd.get("heroTitle") ?? "",
      heroText: fd.get("heroText") ?? "",
      phone: fd.get("phone") ?? "",
      telegram: fd.get("telegram") ?? "",
      instagram: fd.get("instagram") ?? "",
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  await db.center.update({
    where: { id: admin.centerId },
    data: { heroTitle: d.heroTitle || null, heroText: d.heroText || null, phone: d.phone || null, telegram: d.telegram || null, instagram: d.instagram || null },
  });
  await revalidateSite(admin.centerId);
  return { ok: W.saved };
}

/** Adds a course, result or question (id null) or saves changes to one. */
export async function saveSiteItem(kind: SiteKind, id: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireCenterAdmin();
  const t = await getT();
  const W = t.siteAdmin;
  if (!SITE_KINDS.includes(kind)) return { error: t.common.somethingWrong };
  const text = (max: number) => z.string().trim().max(max);
  const parsed = z
    .object({
      title: text(120).min(2, W.errTitle[kind]),
      subtitle: text(80),
      meta: text(60),
      body: text(1000),
    })
    .safeParse({ title: fd.get("title") ?? "", subtitle: fd.get("subtitle") ?? "", meta: fd.get("meta") ?? "", body: fd.get("body") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (kind === "RESULT" && !d.subtitle) return { error: W.errResult };
  if (kind === "FAQ" && !d.body) return { error: W.errAnswer };
  const data = { title: d.title, subtitle: d.subtitle || null, meta: d.meta || null, body: d.body || null };
  if (id) {
    const { count } = await db.siteItem.updateMany({ where: { id, centerId: admin.centerId, kind }, data });
    if (!count) return { error: t.common.notFound };
  } else {
    const last = await db.siteItem.findFirst({ where: { centerId: admin.centerId, kind }, orderBy: { order: "desc" }, select: { order: true } });
    await db.siteItem.create({ data: { ...data, centerId: admin.centerId, kind, order: (last?.order ?? -1) + 1 } });
  }
  await revalidateSite(admin.centerId);
  return { ok: id ? W.saved : W.added };
}

/** Moves an item one place up (-1) or down (1) in its list. */
export async function moveSiteItem(id: string, direction: number) {
  const admin = await requireCenterAdmin();
  const item = await db.siteItem.findFirst({ where: { id, centerId: admin.centerId }, select: { kind: true } });
  if (!item) return;
  const list = await db.siteItem.findMany({
    where: { centerId: admin.centerId, kind: item.kind },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });
  const from = list.findIndex((x) => x.id === id);
  const to = from + (direction < 0 ? -1 : 1);
  if (to < 0 || to >= list.length) return;
  [list[from], list[to]] = [list[to], list[from]];
  await db.$transaction(list.map((x, order) => db.siteItem.update({ where: { id: x.id }, data: { order } })));
  await revalidateSite(admin.centerId);
}

export async function deleteSiteItem(id: string) {
  const admin = await requireCenterAdmin();
  await db.siteItem.deleteMany({ where: { id, centerId: admin.centerId } });
  await revalidateSite(admin.centerId);
}

/** Which teachers the website lists, and the short introduction under each one's name. */
export async function saveTeacherBios(_: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireCenterAdmin();
  const t = await getT();
  const teachers = await db.user.findMany({ where: { centerId: admin.centerId, role: "TEACHER" }, select: { id: true, bio: true, onSite: true } });
  const changes = teachers.flatMap((teacher) => {
    const value = fd.get(`bio_${teacher.id}`);
    // Teachers who joined after the page was opened aren't in the form; leave them as they are.
    if (value === null) return [];
    const bio = String(value).trim().slice(0, 300) || null;
    const onSite = fd.has(`show_${teacher.id}`);
    return bio === teacher.bio && onSite === teacher.onSite ? [] : [db.user.update({ where: { id: teacher.id }, data: { bio, onSite } })];
  });
  if (changes.length) await db.$transaction(changes);
  await revalidateSite(admin.centerId);
  return { ok: t.siteAdmin.saved };
}

/** An admin works through the trial lesson requests: new, contacted, enrolled or closed, with a note. */
export async function updateLead(id: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireCenterAdmin();
  const t = await getT();
  const status = String(fd.get("status") ?? "") as LeadStatus;
  if (!LEAD_STATUSES.includes(status)) return { error: t.common.somethingWrong };
  const note = String(fd.get("note") ?? "").trim().slice(0, 500);
  const { count } = await db.lead.updateMany({ where: { id, centerId: admin.centerId }, data: { status, note: note || null } });
  if (!count) return { error: t.common.notFound };
  // The number of new requests shows next to Applications in the menu.
  revalidatePath("/admin", "layout");
  return { ok: t.leads.saved };
}

export async function deleteLead(id: string) {
  const admin = await requireCenterAdmin();
  await db.lead.deleteMany({ where: { id, centerId: admin.centerId } });
  revalidatePath("/admin", "layout");
}
