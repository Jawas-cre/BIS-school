import "server-only";
import { db } from "@/lib/db";

// A learning center's public website: /c/<slug> for every center, and the home page of a copy that
// belongs to one center (it has an owner). The admin edits it under Website; trial-lesson requests
// arrive under Applications.
export const SITE_KINDS = ["COURSE", "RESULT", "FAQ"] as const;
export type SiteKind = (typeof SITE_KINDS)[number];
export const LEAD_STATUSES = ["NEW", "CONTACTED", "ENROLLED", "CLOSED"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

/** The center a one-center copy belongs to (the owner's), or null on a platform with many centers. */
export async function ownerCenter() {
  const owner = await db.user.findFirst({ where: { isOwner: true, centerId: { not: null } }, select: { centerId: true } });
  return owner?.centerId ? db.center.findUnique({ where: { id: owner.centerId } }) : null;
}

/** Everything the public website shows. */
export async function siteData(centerId: string) {
  const [center, items, branches, teachers, students] = await Promise.all([
    db.center.findUnique({ where: { id: centerId } }),
    db.siteItem.findMany({ where: { centerId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    db.branch.findMany({ where: { centerId }, orderBy: { name: "asc" } }),
    db.user.findMany({
      where: { centerId, role: "TEACHER", onSite: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, bio: true, teaching: { select: { subject: { select: { name: true, color: true } } } } },
    }),
    db.user.count({ where: { centerId, role: "STUDENT" } }),
  ]);
  if (!center) return null;
  return {
    center,
    courses: items.filter((i) => i.kind === "COURSE"),
    results: items.filter((i) => i.kind === "RESULT"),
    faq: items.filter((i) => i.kind === "FAQ"),
    branches,
    teachers: teachers.map((t) => ({
      ...t,
      subjects: [...new Map(t.teaching.flatMap((g) => (g.subject ? [[g.subject.name, g.subject] as const] : []))).values()],
    })),
    students,
  };
}

/** A Telegram or Instagram username or link, as a link. */
export function socialUrl(value: string | null | undefined, network: "telegram" | "instagram") {
  const v = value?.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const name = v.replace(/^@/, "").replace(/^(www\.)?(t\.me|instagram\.com)\//i, "").replace(/\/+$/, "");
  return network === "telegram" ? `https://t.me/${name}` : `https://instagram.com/${name}`;
}
