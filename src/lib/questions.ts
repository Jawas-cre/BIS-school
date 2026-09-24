import "server-only";
import { db } from "@/lib/db";
import { visibleTo } from "@/lib/auth";
import { DIFFICULTIES, TAXONOMY, type Section } from "@/lib/sat";

export type BankFilters = {
  section?: Section;
  domain?: string;
  skill?: string;
  difficulty?: string;
  status?: "new" | "correct" | "incorrect" | "saved";
  q?: string;
};

export function parseFilters(sp: Record<string, string | string[] | undefined>): BankFilters {
  const get = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : undefined);
  const section = get("section");
  const status = get("status");
  const difficulty = get("difficulty");
  return {
    section: section === "MATH" || section === "RW" ? section : undefined,
    domain: get("domain"),
    skill: get("skill"),
    difficulty: difficulty && (DIFFICULTIES as string[]).includes(difficulty) ? difficulty : undefined,
    status: status === "new" || status === "correct" || status === "incorrect" || status === "saved" ? status : undefined,
    q: get("q")?.slice(0, 80),
  };
}

export function filtersToQuery(f: BankFilters, extra: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...f, ...extra })) if (v !== undefined && v !== "") params.set(k, String(v));
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Latest result per question for a user: true = last answer correct, false = incorrect. */
export async function latestResults(userId: string) {
  const attempts = await db.questionAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { questionId: true, correct: true },
  });
  const map = new Map<string, boolean>();
  for (const a of attempts) if (!map.has(a.questionId)) map.set(a.questionId, a.correct);
  return map;
}

/** All question ids (in bank order) matching the filters, plus per-question status. */
export async function bankQuery(user: { id: string; centerId: string | null }, f: BankFilters) {
  const [rows, results, bookmarks] = await Promise.all([
    db.question.findMany({
      where: {
        AND: [
          visibleTo(user.centerId),
          f.section ? { section: f.section } : {},
          f.domain ? { domain: f.domain } : {},
          f.skill ? { skill: f.skill } : {},
          f.difficulty ? { difficulty: f.difficulty } : {},
          f.q ? { OR: [{ stem: { contains: f.q } }, { passage: { contains: f.q } }] } : {},
        ],
      },
      orderBy: [{ section: "desc" }, { domain: "asc" }, { skill: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      select: { id: true, section: true, domain: true, skill: true, difficulty: true, type: true, stem: true, passage: true, centerId: true },
    }),
    latestResults(user.id),
    db.bookmark.findMany({ where: { userId: user.id }, select: { questionId: true } }),
  ]);
  const saved = new Set(bookmarks.map((b) => b.questionId));
  const filtered = rows.filter((r) => {
    if (!f.status) return true;
    if (f.status === "saved") return saved.has(r.id);
    const res = results.get(r.id);
    if (f.status === "new") return res === undefined;
    return f.status === "correct" ? res === true : res === false;
  });
  return { rows: filtered, results, saved };
}

export function skillCounts(rows: { section: string; skill: string }[]) {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.skill, (counts.get(r.skill) ?? 0) + 1);
  return (Object.keys(TAXONOMY) as Section[]).map((section) => ({
    section,
    domains: TAXONOMY[section].map((d) => ({ domain: d.domain, skills: d.skills.map((s) => ({ skill: s, count: counts.get(s) ?? 0 })) })),
  }));
}

/** Plain-text preview of a question for list views. */
export function preview(stem: string, passage: string | null) {
  const text = (passage && passage.length > 20 ? passage : stem)
    .replace(/\$\$[\s\S]*?\$\$/g, " [equation] ")
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\[a-z]+\{?/gi, "")
    .replace(/[{}*>#|\\]/g, "")
    .replace(/_{3,}/g, "______")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 140 ? `${text.slice(0, 140)}…` : text;
}
