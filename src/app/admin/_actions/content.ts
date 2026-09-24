"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff, visibleTo } from "@/lib/auth";
import { ALL_SKILLS, domainOf, type Section } from "@/lib/sat";
import type { ActionState } from "@/components/action-form";

const skillSet = new Set(ALL_SKILLS.map((s) => s.skill));

/** Only http(s) links — a `javascript:` URL would run script when a student clicks it. */
const webUrl = (message: string) => z.string().trim().url(message).refine((u) => /^https?:\/\//i.test(u), message);

// ─── Questions ──────────────────────────────────────────────────────────────

export async function saveQuestion(questionId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = z
    .object({
      skill: z.string().refine((s) => skillSet.has(s), "Choose a skill"),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
      type: z.enum(["MCQ", "SPR"]),
      passage: z.string().max(4000).optional(),
      stem: z.string().trim().min(5, "Write the question").max(2000),
      choiceA: z.string().max(500).optional(),
      choiceB: z.string().max(500).optional(),
      choiceC: z.string().max(500).optional(),
      choiceD: z.string().max(500).optional(),
      answer: z.string().trim().min(1, "Enter the correct answer").max(60),
      explanation: z.string().trim().min(5, "Add an explanation").max(4000),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const section = ALL_SKILLS.find((s) => s.skill === d.skill)!.section;
  const choices = [d.choiceA, d.choiceB, d.choiceC, d.choiceD].map((c) => (c ?? "").trim());
  let answer = d.answer;
  if (d.type === "MCQ") {
    if (choices.some((c) => !c)) return { error: "Fill in all four answer choices" };
    answer = d.answer.toUpperCase();
    if (!["A", "B", "C", "D"].includes(answer)) return { error: "The answer must be A, B, C or D" };
  }
  const data = {
    section,
    domain: domainOf(section as Section, d.skill),
    skill: d.skill,
    difficulty: d.difficulty,
    type: d.type,
    passage: d.passage?.trim() || null,
    stem: d.stem,
    choices: JSON.stringify(d.type === "MCQ" ? choices : []),
    answer,
    explanation: d.explanation,
  };
  if (questionId) {
    const existing = await db.question.findFirst({ where: { id: questionId, centerId: staff.centerId } });
    if (!existing) return { error: "Only your center's questions can be edited" };
    await db.question.update({ where: { id: questionId }, data });
  } else {
    await db.question.create({ data: { ...data, centerId: staff.centerId } });
  }
  revalidatePath("/admin/questions");
  redirect("/admin/questions?saved=1");
}

export async function deleteQuestion(questionId: string) {
  const staff = await requireStaff();
  await db.question.deleteMany({ where: { id: questionId, centerId: staff.centerId } });
  revalidatePath("/admin/questions");
}

// ─── Tests ──────────────────────────────────────────────────────────────────

export async function createTestFromBank(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = z
    .object({
      title: z.string().trim().min(3, "Give the test a title").max(80),
      description: z.string().trim().max(300).optional(),
      section: z.enum(["RW", "MATH"]),
      skill: z.string().optional(),
      difficulty: z.enum(["ANY", "EASY", "MEDIUM", "HARD"]),
      count: z.coerce.number().int().min(3).max(54),
      minutes: z.coerce.number().int().min(3).max(120),
      onlyCenter: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const skill = d.skill && skillSet.has(d.skill) ? d.skill : null;
  const pool = await db.question.findMany({
    where: {
      AND: [
        d.onlyCenter ? { centerId: staff.centerId } : visibleTo(staff.centerId),
        { section: d.section },
        skill ? { skill } : {},
        d.difficulty !== "ANY" ? { difficulty: d.difficulty } : {},
      ],
    },
    select: { id: true, difficulty: true },
  });
  if (pool.length < d.count) return { error: `Only ${pool.length} questions match — lower the count or widen the filters.` };
  const rank = { EASY: 0, MEDIUM: 1, HARD: 2 } as Record<string, number>;
  const picked = pool
    .map((q) => ({ q, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, d.count)
    .map((x) => x.q)
    .sort((a, b) => rank[a.difficulty] - rank[b.difficulty]);

  await db.test.create({
    data: {
      centerId: staff.centerId,
      title: d.title,
      description: d.description || null,
      kind: skill ? "TOPIC" : "SECTION",
      section: d.section,
      skill,
      modules: {
        create: {
          order: 0,
          section: d.section,
          title: skill ?? (d.section === "RW" ? "Reading and Writing" : "Math"),
          minutes: d.minutes,
          questions: { create: picked.map((q, i) => ({ questionId: q.id, order: i })) },
        },
      },
    },
  });
  revalidatePath("/admin/tests");
  return { ok: `“${d.title}” created with ${d.count} questions and published to your students.` };
}

export async function toggleTestPublished(testId: string) {
  const staff = await requireStaff();
  const test = await db.test.findFirst({ where: { id: testId, centerId: staff.centerId } });
  if (test) await db.test.update({ where: { id: testId }, data: { published: !test.published } });
  revalidatePath("/admin/tests");
}

export async function deleteTest(testId: string) {
  const staff = await requireStaff();
  await db.test.deleteMany({ where: { id: testId, centerId: staff.centerId } });
  revalidatePath("/admin/tests");
}

// ─── Roadmap ────────────────────────────────────────────────────────────────

/** Copies the platform roadmap into center-owned units that can then be edited. */
export async function customizeRoadmap() {
  const staff = await requireStaff();
  if ((await db.roadmapUnit.count({ where: { centerId: staff.centerId } })) === 0) {
    const base = await db.roadmapUnit.findMany({ where: { centerId: null }, orderBy: { order: "asc" } });
    await db.roadmapUnit.createMany({
      data: base.map((u) => ({ centerId: staff.centerId, order: u.order, title: u.title, section: u.section, skill: u.skill, summary: u.summary, videoUrl: u.videoUrl, notes: u.notes })),
    });
  }
  revalidatePath("/admin/roadmap");
}

export async function resetRoadmap() {
  const staff = await requireStaff();
  await db.roadmapUnit.deleteMany({ where: { centerId: staff.centerId } });
  revalidatePath("/admin/roadmap");
}

export async function saveUnit(unitId: string | null, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = z
    .object({
      title: z.string().trim().min(2, "Enter a title").max(80),
      section: z.enum(["RW", "MATH"]),
      skill: z.string().optional(),
      summary: z.string().trim().min(2, "Add a one-line summary").max(200),
      videoUrl: z.union([z.literal(""), webUrl("Enter a valid video link")]).optional(),
      notes: z.string().max(20000).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const data = { ...d, skill: d.skill && skillSet.has(d.skill) ? d.skill : null, videoUrl: d.videoUrl || null, notes: d.notes ?? "" };
  if (unitId) {
    const unit = await db.roadmapUnit.findFirst({ where: { id: unitId, centerId: staff.centerId } });
    if (!unit) return { error: "Customize the roadmap before editing units" };
    await db.roadmapUnit.update({ where: { id: unitId }, data });
  } else {
    const last = await db.roadmapUnit.findFirst({ where: { centerId: staff.centerId }, orderBy: { order: "desc" } });
    await db.roadmapUnit.create({ data: { ...data, centerId: staff.centerId, order: (last?.order ?? -1) + 1 } });
  }
  revalidatePath("/admin/roadmap");
  redirect("/admin/roadmap");
}

export async function moveUnit(unitId: string, direction: -1 | 1) {
  const staff = await requireStaff();
  const units = await db.roadmapUnit.findMany({ where: { centerId: staff.centerId }, orderBy: { order: "asc" } });
  const i = units.findIndex((u) => u.id === unitId);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= units.length) return;
  await db.$transaction([
    db.roadmapUnit.update({ where: { id: units[i].id }, data: { order: units[j].order } }),
    db.roadmapUnit.update({ where: { id: units[j].id }, data: { order: units[i].order } }),
  ]);
  revalidatePath("/admin/roadmap");
}

export async function deleteUnit(unitId: string) {
  const staff = await requireStaff();
  await db.roadmapUnit.deleteMany({ where: { id: unitId, centerId: staff.centerId } });
  revalidatePath("/admin/roadmap");
}

// ─── Vocabulary ─────────────────────────────────────────────────────────────

/** One word per line: word | part of speech | definition | example | synonyms */
function parseWords(raw: string) {
  const words = [];
  for (const line of raw.split("\n").map((l) => l.trim()).filter(Boolean)) {
    const [word, pos, definition, example, synonyms] = line.split("|").map((s) => s?.trim() ?? "");
    if (!word || !definition) return { error: `Line “${line.slice(0, 40)}” needs at least a word and a definition` } as const;
    words.push({ word, pos: pos || "—", definition, example: example || "", synonyms: synonyms || "" });
  }
  return { words } as const;
}

export async function createDeck(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 2) return { error: "Give the deck a title" };
  const parsed = parseWords(String(fd.get("words") ?? ""));
  if ("error" in parsed) return { error: parsed.error };
  await db.vocabDeck.create({
    data: {
      centerId: staff.centerId,
      title,
      description: String(fd.get("description") ?? "").trim() || null,
      level: ["Core", "Advanced", "Expert"].includes(String(fd.get("level"))) ? String(fd.get("level")) : "Core",
      words: { create: parsed.words },
    },
  });
  revalidatePath("/admin/vocabulary");
  return { ok: `Deck created with ${parsed.words.length} words` };
}

export async function addWords(deckId: string, _: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  if (!(await db.vocabDeck.findFirst({ where: { id: deckId, centerId: staff.centerId } }))) return { error: "Deck not found" };
  const parsed = parseWords(String(fd.get("words") ?? ""));
  if ("error" in parsed) return { error: parsed.error };
  if (!parsed.words.length) return { error: "Add at least one word" };
  await db.vocabWord.createMany({ data: parsed.words.map((w) => ({ ...w, deckId })) });
  revalidatePath("/admin/vocabulary");
  return { ok: `${parsed.words.length} words added` };
}

export async function deleteDeck(deckId: string) {
  const staff = await requireStaff();
  await db.vocabDeck.deleteMany({ where: { id: deckId, centerId: staff.centerId } });
  revalidatePath("/admin/vocabulary");
}

// ─── Library ────────────────────────────────────────────────────────────────

export async function createLibraryItem(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = z
    .object({
      title: z.string().trim().min(2, "Enter a title").max(120),
      author: z.string().trim().max(80).optional(),
      description: z.string().trim().max(400).optional(),
      category: z.enum(["PRACTICE", "BOOK", "GUIDE", "VIDEO"]),
      url: webUrl("Enter a valid link (https://…)"),
      pages: z.union([z.literal(""), z.coerce.number().int().min(1).max(5000)]).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  await db.libraryItem.create({
    data: { centerId: staff.centerId, title: d.title, author: d.author || null, description: d.description || null, category: d.category, url: d.url, pages: typeof d.pages === "number" ? d.pages : null },
  });
  revalidatePath("/admin/library");
  return { ok: "Added to your library" };
}

export async function deleteLibraryItem(itemId: string) {
  const staff = await requireStaff();
  await db.libraryItem.deleteMany({ where: { id: itemId, centerId: staff.centerId } });
  revalidatePath("/admin/library");
}

// ─── Announcements ──────────────────────────────────────────────────────────

export async function createNews(_: ActionState, fd: FormData): Promise<ActionState> {
  const staff = await requireStaff();
  const parsed = z
    .object({
      title: z.string().trim().min(3, "Enter a title").max(120),
      body: z.string().trim().min(3, "Write the announcement").max(5000),
      tag: z.enum(["Announcement", "Event", "Update", "Tip"]),
      pinned: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  await db.newsPost.create({ data: { centerId: staff.centerId, authorId: staff.id, title: d.title, body: d.body, tag: d.tag, pinned: Boolean(d.pinned) } });
  revalidatePath("/admin/news");
  revalidatePath("/news");
  return { ok: "Published to your students" };
}

export async function togglePin(postId: string) {
  const staff = await requireStaff();
  const post = await db.newsPost.findFirst({ where: { id: postId, centerId: staff.centerId } });
  if (post) await db.newsPost.update({ where: { id: postId }, data: { pinned: !post.pinned } });
  revalidatePath("/admin/news");
}

export async function deleteNews(postId: string) {
  const staff = await requireStaff();
  await db.newsPost.deleteMany({ where: { id: postId, centerId: staff.centerId } });
  revalidatePath("/admin/news");
}
