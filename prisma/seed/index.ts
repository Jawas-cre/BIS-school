import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateMath, mulberry32, shuffle, int, pick, type GenQuestion } from "./math";
import { generateEnglish } from "./rw";
import { generateArithmetic, generateBiology, generateChemistry, generateComputerScience, generateHistory, generatePhysics } from "./science";
import { UNIVERSITIES } from "./universities";
import { LIBRARY, PLATFORM_NEWS, ROADMAP, SUBJECTS, VOCAB_DECKS } from "./content";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { SAMPLE_CONTENT, SAMPLE_TASK1_IMAGE, SAMPLE_TITLE } from "../../src/lib/mock/sample";
import { parseSection } from "../../src/lib/mock/format";
import { band, markAll } from "../../src/lib/mock/score";

const db = new PrismaClient();
// `--no-demo`: only the shared learning content, no demo center or accounts. The first visitor then
// creates their own center and admin password on the /setup page.
const NO_DEMO = process.argv.includes("--no-demo");
const rng = mulberry32(42);
const DAY = 86_400_000;

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

async function reset() {
  // Children first so foreign keys never block deletes.
  await db.aiMessage.deleteMany();
  await db.aiConversation.deleteMany();
  await db.userWord.deleteMany();
  await db.vocabWord.deleteMany();
  await db.vocabDeck.deleteMany();
  await db.groupUnlock.deleteMany();
  await db.unitProgress.deleteMany();
  await db.roadmapUnit.deleteMany();
  await db.testAttempt.deleteMany();
  await db.testQuestion.deleteMany();
  await db.testModule.deleteMany();
  await db.test.deleteMany();
  await db.questionAttempt.deleteMany();
  await db.bookmark.deleteMany();
  await db.question.deleteMany();
  await db.activityDay.deleteMany();
  await db.newsPost.deleteMany();
  await db.libraryItem.deleteMany();
  await db.groupMember.deleteMany();
  await db.inviteCode.deleteMany();
  await db.group.deleteMany();
  await db.user.deleteMany();
  await db.topic.deleteMany();
  await db.subject.deleteMany();
  await db.branch.deleteMany();
  await db.siteItem.deleteMany();
  await db.lead.deleteMany();
  await db.mockAttempt.deleteMany();
  await db.mockCandidate.deleteMany();
  await db.mockTest.deleteMany();
  await db.mockFile.deleteMany();
  await db.center.deleteMany();
  await db.university.deleteMany();
}

type SeededQuestion = { id: string; subjectId: string; topicId: string; difficulty: string; type: string; answer: string };
type SubjectRef = { id: string; name: string; topics: Map<string, string> };

async function createSubject(data: { name: string; icon: string; color: string; description: string; topics: string[] }, order: number, centerId: string | null): Promise<SubjectRef> {
  const subject = await db.subject.create({
    data: {
      centerId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      description: data.description,
      order,
      topics: { create: data.topics.map((name, i) => ({ name, order: i })) },
    },
    include: { topics: true },
  });
  return { id: subject.id, name: subject.name, topics: new Map(subject.topics.map((t) => [t.name, t.id])) };
}

async function seedQuestions(questions: GenQuestion[], subject: SubjectRef, centerId: string | null) {
  const out: SeededQuestion[] = [];
  for (const q of questions) {
    const topicId = subject.topics.get(q.topic);
    if (!topicId) throw new Error(`Unknown topic ${q.topic} for ${subject.name}`);
    const row = await db.question.create({
      data: {
        centerId,
        subjectId: subject.id,
        topicId,
        difficulty: q.difficulty,
        type: q.type,
        passage: q.passage ?? null,
        stem: q.stem,
        choices: JSON.stringify(q.choices ?? []),
        answer: q.answer,
        explanation: q.explanation,
      },
    });
    out.push({ id: row.id, subjectId: subject.id, topicId, difficulty: q.difficulty, type: q.type, answer: q.answer });
  }
  return out;
}

const RANK: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };

/** Picks n unused questions from a pool, ordered easiest or hardest first. */
function take(pool: SeededQuestion[], n: number, used: Set<string>, order: "easy-first" | "hard-first" = "easy-first") {
  const available = shuffle(rng, pool.filter((q) => !used.has(q.id)));
  const chosen = (available.length >= n ? available : shuffle(rng, pool)).slice(0, n);
  chosen.forEach((q) => used.add(q.id));
  return chosen.sort((a, b) => (order === "easy-first" ? RANK[a.difficulty] - RANK[b.difficulty] : RANK[b.difficulty] - RANK[a.difficulty]));
}

async function createTest(
  data: { title: string; description: string; kind: string; subjectId: string | null; centerId?: string | null },
  sections: { title: string; minutes: number; questions: SeededQuestion[] }[],
) {
  return db.test.create({
    data: {
      title: data.title,
      description: data.description,
      kind: data.kind,
      subjectId: data.subjectId,
      centerId: data.centerId ?? null,
      modules: {
        create: sections.map((m, i) => ({
          order: i,
          title: m.title,
          minutes: m.minutes,
          questions: { create: m.questions.map((q, j) => ({ questionId: q.id, order: j })) },
        })),
      },
    },
    include: { modules: { include: { questions: { include: { question: true } } } } },
  });
}

function wrongResponse(q: { type: string; answer: string }) {
  if (q.type === "MCQ") return pick(rng, ["A", "B", "C", "D"].filter((l) => l !== q.answer));
  const n = Number(q.answer.split("|")[0]);
  return Number.isFinite(n) ? String(n + pick(rng, [-2, -1, 1, 3])) : "?";
}

const minutesFor = (subject: string, n: number) => Math.ceil(n * (["Mathematics", "Physics", "Chemistry", "Mental Arithmetic"].includes(subject) ? 2 : 1.2));

async function main() {
  console.log("Resetting database…");
  await reset();

  console.log("Universities…");
  await db.university.createMany({ data: UNIVERSITIES.map((u, i) => ({ ...u, rank: i + 1 })) });
  const unis = await db.university.findMany({ orderBy: { rank: "asc" } });

  console.log("Subjects and question bank…");
  const subjects = new Map<string, SubjectRef>();
  for (const [i, s] of SUBJECTS.entries()) subjects.set(s.name, await createSubject(s, i, null));
  const S = (name: string) => subjects.get(name)!;
  const pools = new Map<string, SeededQuestion[]>();
  const generated: [string, GenQuestion[]][] = [
    ["Mathematics", generateMath(6)],
    ["English", generateEnglish()],
    ["Physics", generatePhysics()],
    ["Chemistry", generateChemistry()],
    ["Biology", generateBiology()],
    ["History", generateHistory()],
    ["Computer Science", generateComputerScience()],
  ];
  for (const [name, qs] of generated) pools.set(name, await seedQuestions(qs, S(name), null));
  console.log(`  ${[...pools.values()].reduce((n, p) => n + p.length, 0)} questions in ${pools.size} subjects`);

  console.log("Mock tests…");
  const exams = new Map<string, Awaited<ReturnType<typeof createTest>>>();
  const topicQuizzes = new Map<string, Awaited<ReturnType<typeof createTest>>[]>();
  for (const [name, pool] of pools) {
    const per = Math.min(15, Math.floor(pool.length / 2));
    const used = new Set<string>();
    exams.set(
      name,
      await createTest(
        { title: `${name} — Term Exam`, description: `A two-part timed exam covering every ${name.toLowerCase()} topic.`, kind: "EXAM", subjectId: S(name).id },
        [
          { title: "Part A", minutes: minutesFor(name, per), questions: take(pool, per, used, "easy-first") },
          { title: "Part B", minutes: minutesFor(name, per), questions: take(pool, per, used, "hard-first") },
        ],
      ),
    );
    const quizzes = [];
    for (const [topic, topicId] of S(name).topics) {
      const tp = pool.filter((q) => q.topicId === topicId);
      if (tp.length < 6) continue;
      const qs = take(tp, Math.min(10, tp.length), new Set());
      quizzes.push(
        await createTest(
          { title: `${topic}`, description: `${qs.length} questions on ${topic.toLowerCase()}.`, kind: "TOPIC", subjectId: S(name).id },
          [{ title: topic, minutes: minutesFor(name, qs.length), questions: qs }],
        ),
      );
    }
    topicQuizzes.set(name, quizzes);
  }
  const mixedUsed = new Set<string>();
  await createTest(
    { title: "University Entrance Practice", description: "A mixed exam with Mathematics, English and Physics sections, like many university entrance tests.", kind: "EXAM", subjectId: null },
    [
      { title: "Mathematics", minutes: 30, questions: take(pools.get("Mathematics")!, 15, mixedUsed) },
      { title: "English", minutes: 20, questions: take(pools.get("English")!, 15, mixedUsed) },
      { title: "Physics", minutes: 20, questions: take(pools.get("Physics")!, 10, mixedUsed) },
    ],
  );

  console.log("Roadmap, vocabulary, library, news…");
  const unitsBySubject = new Map<string, { id: string }[]>();
  for (const u of ROADMAP) {
    const subject = S(u.subject);
    const list = unitsBySubject.get(u.subject) ?? [];
    const unit = await db.roadmapUnit.create({
      data: { subjectId: subject.id, topicId: u.topic ? subject.topics.get(u.topic) ?? null : null, order: list.length, title: u.title, summary: u.summary, notes: u.notes },
    });
    list.push(unit);
    unitsBySubject.set(u.subject, list);
  }
  const decks = [];
  for (const d of VOCAB_DECKS) {
    decks.push(
      await db.vocabDeck.create({
        data: {
          title: d.title,
          description: d.description,
          level: d.level,
          subjectId: d.subject ? S(d.subject).id : null,
          words: { create: d.words.map(([word, pos, definition, example, synonyms]) => ({ word, pos, definition, example, synonyms })) },
        },
        include: { words: true },
      }),
    );
  }
  await db.libraryItem.createMany({ data: LIBRARY.map(({ subject, ...l }) => ({ ...l, subjectId: subject ? S(subject).id : null })) });
  for (const [i, n] of PLATFORM_NEWS.entries()) {
    await db.newsPost.create({ data: { ...n, createdAt: new Date(Date.now() - (PLATFORM_NEWS.length - i) * 5 * DAY) } });
  }

  if (NO_DEMO) {
    console.log("\nDone. Learning content is ready, with no demo accounts.");
    // The double-click launcher asks for the admin's email and password itself.
    if (!process.env.BIS_LAUNCHER) console.log("Open the site to create your own center and admin password.");
    return;
  }

  console.log("Accounts & demo center…");
  const hash = await bcrypt.hash("password123", 10);
  await db.user.create({ data: { email: "owner@bislearn.uz", name: "Platform Owner", passwordHash: hash, role: "SUPER_ADMIN", onboarded: true } });

  const center = await db.center.create({
    data: {
      name: "Bright Future Academy",
      slug: "bright-future",
      city: "Tashkent",
      about: "Mathematics, sciences and languages for school students in Tashkent since 2019.",
      inviteCode: "DEMO24",
      accent: "#2563eb",
      heroTitle: "Strong grades, confident students, open doors",
      heroText: "Mathematics, sciences, English and mental arithmetic for grades 5–11 at two branches in Tashkent. Small groups, experienced teachers and weekly progress reports for parents.",
      phone: "+998 71 200 12 12",
      telegram: "@brightfuture_academy",
      instagram: "@brightfuture.academy",
    },
  });

  // A center-only subject with its own questions and quiz.
  const arithmetic = await createSubject({ name: "Mental Arithmetic", icon: "sigma", color: "#4f46e5", description: "Fast calculation skills for younger students.", topics: ["Addition & subtraction", "Multiplication", "Division"] }, 20, center.id);
  subjects.set("Mental Arithmetic", arithmetic);
  const arithmeticPool = await seedQuestions(generateArithmetic(), arithmetic, center.id);
  pools.set("Mental Arithmetic", arithmeticPool);
  exams.set("Mental Arithmetic", await createTest(
    { title: "Mental Arithmetic — Speed Test", description: "20 quick calculations. Work them out in your head!", kind: "EXAM", subjectId: arithmetic.id, centerId: center.id },
    [{ title: "Speed round", minutes: 10, questions: take(arithmeticPool, 20, new Set()) }],
  ));

  const [chilonzor, yunusobod] = await Promise.all([
    db.branch.create({ data: { centerId: center.id, name: "Chilonzor branch", address: "Bunyodkor Ave 12, Tashkent", phone: "+998 71 200 12 12" } }),
    db.branch.create({ data: { centerId: center.id, name: "Yunusobod branch", address: "Amir Temur St 108, Tashkent", phone: "+998 71 200 34 34" } }),
  ]);
  await db.user.create({ data: { email: "admin@demo.uz", name: "Kamola Rashidova", passwordHash: hash, role: "CENTER_ADMIN", centerId: center.id, onboarded: true } });
  const teacher = (email: string, loginId: string, name: string, branchId: string, bio: string) =>
    db.user.create({ data: { email, loginId, name, bio, passwordHash: hash, role: "TEACHER", centerId: center.id, branchId, onboarded: true } });
  const jasur = await teacher("teacher@demo.uz", "T1001", "Jasur Tursunov", chilonzor.id, "Mathematics and physics · 8 years of teaching · prepares students for lyceum entrance exams and olympiads.");
  const malika = await teacher("teacher2@demo.uz", "T1002", "Malika Yusupova", yunusobod.id, "English · IELTS 8.5 · CELTA · 6 years of teaching; also runs the mental arithmetic club for kids.");
  const otabek = await teacher("teacher3@demo.uz", "T1003", "Otabek Rahimov", chilonzor.id, "Chemistry and biology · medical university graduate · 5 years preparing students for medical admissions.");

  const groupDefs = [
    { key: "math", name: "Mathematics · Grade 9 A", subject: "Mathematics", teacher: jasur, branch: chilonzor, schedule: "Mon / Wed / Fri · 15:00", unlocked: 3 },
    { key: "english", name: "English · Intermediate B1", subject: "English", teacher: malika, branch: yunusobod, schedule: "Tue / Thu / Sat · 17:00", unlocked: 2 },
    { key: "physics", name: "Physics · Grade 10", subject: "Physics", teacher: jasur, branch: chilonzor, schedule: "Tue / Thu · 16:30", unlocked: 2 },
    { key: "chemistry", name: "Chemistry · Medical track", subject: "Chemistry", teacher: otabek, branch: chilonzor, schedule: "Mon / Wed · 17:00", unlocked: 1 },
    { key: "biology", name: "Biology · Medical track", subject: "Biology", teacher: otabek, branch: chilonzor, schedule: "Fri / Sat · 11:00", unlocked: 1 },
    { key: "arithmetic", name: "Mental Arithmetic · Kids", subject: "Mental Arithmetic", teacher: malika, branch: yunusobod, schedule: "Sat / Sun · 10:00", unlocked: 0 },
  ];
  const groups = new Map<string, { id: string; subject: string }>();
  for (const g of groupDefs) {
    const group = await db.group.create({
      data: { centerId: center.id, branchId: g.branch.id, subjectId: S(g.subject).id, teacherId: g.teacher.id, name: g.name, schedule: g.schedule },
    });
    const units = unitsBySubject.get(g.subject) ?? [];
    if (g.unlocked) await db.groupUnlock.createMany({ data: units.slice(1, 1 + g.unlocked).map((u) => ({ groupId: group.id, unitId: u.id })) });
    groups.set(g.key, { id: group.id, subject: g.subject });
  }
  // Sample invite codes: one that puts new students straight into a group, one for new teachers.
  await db.inviteCode.createMany({
    data: [
      { centerId: center.id, code: "MATH9A", role: "STUDENT", groupId: groups.get("math")!.id, label: "Mathematics · Grade 9 A — new students", maxUses: 30 },
      { centerId: center.id, code: "TEACH24", role: "TEACHER", label: "New teachers", maxUses: 5 },
    ],
  });

  await db.newsPost.create({
    data: {
      centerId: center.id,
      title: "Saturday mock exams at both branches",
      tag: "Event",
      pinned: true,
      body: "This Saturday at **10:00** we run term exams in Mathematics, English and Physics at the Chilonzor and Yunusobod branches. Bring a charged laptop and arrive 15 minutes early. Results appear in your dashboard the same day.",
      createdAt: new Date(Date.now() - 2 * DAY),
    },
  });
  await db.newsPost.create({
    data: {
      centerId: center.id,
      title: "New vocabulary challenge",
      tag: "Announcement",
      body: "English students: master the **Academic English — Core** deck by the end of the month. Your teachers can see your progress.",
      createdAt: new Date(Date.now() - 6 * DAY),
    },
  });

  const exam = new Date("2026-12-05T09:00:00+05:00");
  const students: { name: string; email: string; groups: string[]; ability: number; grade: string; goal: string }[] = [
    { name: "Aziza Karimova", email: "student@demo.uz", groups: ["math", "english", "physics"], ability: 0.74, grade: "Grade 10", goal: "Study computer science at Inha University" },
    { name: "Bekzod Aliyev", email: "bekzod@demo.uz", groups: ["math", "physics"], ability: 0.82, grade: "Grade 10", goal: "Win the regional physics olympiad" },
    { name: "Dilnoza Rahimova", email: "dilnoza@demo.uz", groups: ["chemistry", "biology", "english"], ability: 0.7, grade: "Grade 11", goal: "Get into medical school" },
    { name: "Farrukh Nazarov", email: "farrukh@demo.uz", groups: ["math", "english"], ability: 0.6, grade: "Grade 9", goal: "Pass the lyceum entrance exam" },
    { name: "Gulnora Saidova", email: "gulnora@demo.uz", groups: ["chemistry", "biology"], ability: 0.78, grade: "Grade 11", goal: "Study medicine" },
    { name: "Islom Qodirov", email: "islom@demo.uz", groups: ["math", "physics", "english"], ability: 0.68, grade: "Grade 10", goal: "Study engineering at Turin Polytechnic" },
    { name: "Jahongir Ergashev", email: "jahongir@demo.uz", groups: ["math"], ability: 0.55, grade: "Grade 9", goal: "Improve my maths grade" },
    { name: "Kamila Usmonova", email: "kamila@demo.uz", groups: ["english", "biology"], ability: 0.75, grade: "Grade 11", goal: "IELTS 7.0" },
    { name: "Laziz Mirzayev", email: "laziz@demo.uz", groups: ["english", "math"], ability: 0.62, grade: "Grade 9", goal: "Study at Westminster University in Tashkent" },
    { name: "Madina Xolmatova", email: "madina@demo.uz", groups: ["chemistry", "biology", "english"], ability: 0.86, grade: "Grade 11", goal: "Study medicine abroad" },
    { name: "Nodir Sobirov", email: "nodir@demo.uz", groups: ["physics", "math"], ability: 0.57, grade: "Grade 10", goal: "Pass my exams" },
    { name: "Oydin Hamidova", email: "oydin@demo.uz", groups: ["english"], ability: 0.69, grade: "Grade 8", goal: "Speak English confidently" },
    { name: "Rustam Jo'rayev", email: "rustam@demo.uz", groups: ["arithmetic", "math"], ability: 0.64, grade: "Grade 6", goal: "Get faster at calculations" },
    { name: "Sevara Ismoilova", email: "sevara@demo.uz", groups: ["arithmetic", "english"], ability: 0.8, grade: "Grade 6", goal: "Top of my class" },
  ];

  const now = Date.now();
  const today = dayKey(new Date());

  for (const [si, s] of students.entries()) {
    const isDemo = si === 0;
    const mySubjects = s.groups.map((g) => groups.get(g)!.subject);
    const user = await db.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash: hash,
        role: "STUDENT",
        centerId: center.id,
        branchId: s.groups.includes("english") && !s.groups.includes("math") ? yunusobod.id : chilonzor.id,
        onboarded: true,
        grade: s.grade,
        goal: s.goal,
        examDate: exam,
        targetUniId: unis[int(rng, 0, 12)].id,
        phone: `+998 9${int(rng, 0, 9)} ${int(rng, 100, 999)} ${int(rng, 10, 99)} ${int(rng, 10, 99)}`,
        createdAt: new Date(now - 50 * DAY),
        memberships: { create: s.groups.map((g) => ({ groupId: groups.get(g)!.id })) },
      },
    });

    // ── Daily practice over the last 45 days; the demo student has a 12-day streak ──
    const bank = mySubjects.flatMap((name) => pools.get(name) ?? []);
    const attempts: { userId: string; questionId: string; response: string; correct: boolean; seconds: number; source: string; createdAt: Date }[] = [];
    const days = new Map<string, { questions: number; correct: number; minutes: number }>();
    for (let d = 44; d >= 0; d--) {
      const active = isDemo ? d < 12 || rng() < 0.6 : rng() < 0.35 + s.ability * 0.4;
      if (!active) continue;
      const date = new Date(now - d * DAY - int(rng, 0, 6) * 3_600_000);
      const n = int(rng, 6, 18);
      const progress = (44 - d) / 44;
      let correct = 0;
      for (let i = 0; i < n; i++) {
        const q = pick(rng, bank);
        const p = Math.min(0.95, s.ability - 0.06 + progress * 0.12 - (q.difficulty === "HARD" ? 0.15 : q.difficulty === "EASY" ? -0.1 : 0));
        const ok = rng() < p;
        if (ok) correct++;
        attempts.push({ userId: user.id, questionId: q.id, response: ok ? q.answer.split("|")[0] : wrongResponse(q), correct: ok, seconds: int(rng, 20, 140), source: "BANK", createdAt: new Date(date.getTime() + i * 90_000) });
      }
      const key = dayKey(date);
      const prev = days.get(key) ?? { questions: 0, correct: 0, minutes: 0 };
      days.set(key, { questions: prev.questions + n, correct: prev.correct + correct, minutes: prev.minutes + Math.round(n * 1.4) });
    }

    // ── Completed tests in each subject, improving over time ──
    const plan: { test: NonNullable<ReturnType<typeof exams.get>>; when: number; skill: number }[] = [];
    for (const [k, subject] of mySubjects.entries()) {
      const quizzes = topicQuizzes.get(subject) ?? [];
      const count = isDemo ? 3 : int(rng, 1, 3);
      for (let t = 0; t < count; t++) {
        const test = t === count - 1 || quizzes.length === 0 ? exams.get(subject)! : quizzes[(t + k) % quizzes.length];
        plan.push({ test, when: 40 - t * 13 - k * 2, skill: Math.min(0.96, s.ability - 0.08 + t * 0.06) });
      }
    }
    for (const { test, when, skill } of plan) {
      const at = new Date(now - when * DAY);
      const answers: Record<string, string> = {};
      let correct = 0;
      let total = 0;
      for (const mod of test.modules) {
        for (const { question: q } of mod.questions) {
          const ok = rng() < skill - (q.difficulty === "HARD" ? 0.12 : q.difficulty === "EASY" ? -0.06 : 0);
          const response = ok ? q.answer.split("|")[0] : wrongResponse(q);
          answers[q.id] = response;
          total++;
          if (ok) correct++;
          attempts.push({ userId: user.id, questionId: q.id, response, correct: ok, seconds: int(rng, 30, 110), source: "TEST", createdAt: at });
        }
      }
      const minutes = test.modules.reduce((m, x) => m + x.minutes, 0);
      await db.testAttempt.create({
        data: {
          userId: user.id,
          testId: test.id,
          status: "COMPLETED",
          moduleIndex: test.modules.length - 1,
          answers: JSON.stringify(answers),
          correct,
          total,
          score: pct(correct, total),
          startedAt: at,
          moduleStarted: at,
          finishedAt: new Date(at.getTime() + minutes * 0.8 * 60_000),
        },
      });
    }

    await db.questionAttempt.createMany({ data: attempts });
    await db.activityDay.createMany({ data: [...days.entries()].map(([day, v]) => ({ userId: user.id, day, ...v })) });

    // Streak from the most recent consecutive active days.
    const keys = new Set(days.keys());
    let streakDays = 0;
    let cursor = keys.has(today) ? new Date() : new Date(now - DAY);
    while (keys.has(dayKey(cursor))) {
      streakDays++;
      cursor = new Date(cursor.getTime() - DAY);
    }

    // ── Roadmap progress per subject, vocabulary for English students ──
    let unitsDone = 0;
    for (const subject of mySubjects) {
      const units = unitsBySubject.get(subject) ?? [];
      const done = isDemo ? Math.min(units.length - 1, 3) : int(rng, 0, Math.max(0, units.length - 2));
      for (const u of units.slice(0, done)) {
        await db.unitProgress.create({ data: { userId: user.id, unitId: u.id, quizScore: int(rng, 60, 100), completedAt: new Date(now - int(rng, 1, 30) * DAY) } });
      }
      unitsDone += done;
    }
    if (mySubjects.includes("English")) {
      const words = decks[0].words.slice(0, isDemo ? 16 : int(rng, 4, 18));
      await db.userWord.createMany({ data: words.map((w) => ({ userId: user.id, wordId: w.id, box: int(rng, 1, 5), nextReview: new Date(now + int(rng, -2, 5) * DAY) })) });
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        streak: streakDays,
        bestStreak: Math.max(streakDays, int(rng, streakDays, streakDays + 9)),
        lastActiveOn: [...keys].sort().pop() ?? null,
        xp: attempts.filter((a) => a.correct).length * 10 + attempts.length * 2 + unitsDone * 50,
      },
    });
    if (isDemo) console.log(`  demo student: ${plan.length} tests, streak ${streakDays}`);
  }

  console.log("Journal…");
  // Lessons over the last four weeks on each group's schedule, with attendance and some 1–5 grades.
  const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  for (const g of groupDefs) {
    const { id, subject } = groups.get(g.key)!;
    const weekdays = g.schedule.split("·")[0].split("/").map((d) => WEEKDAY[d.trim()]);
    const members = await db.groupMember.findMany({ where: { groupId: id }, select: { userId: true } });
    const topicNames = [...S(subject).topics.keys()];
    let lessonNo = 0;
    for (let back = 28; back >= 1; back--) {
      const when = new Date(Date.now() - back * DAY);
      if (!weekdays.includes(when.getUTCDay())) continue;
      const lesson = await db.lesson.create({ data: { groupId: id, day: when.toISOString().slice(0, 10), topic: topicNames[lessonNo++ % topicNames.length] ?? null } });
      await db.attendance.createMany({
        data: members.map(({ userId }) => {
          const r = rng();
          const status = r < 0.84 ? "PRESENT" : r < 0.92 ? "LATE" : r < 0.97 ? "ABSENT" : "EXCUSED";
          const grade = (status === "PRESENT" || status === "LATE") && rng() < 0.55 ? pick(rng, [5, 5, 4, 4, 4, 3, 5, 3]) : null;
          return { lessonId: lesson.id, userId, status, grade };
        }),
      });
    }
  }

  console.log("Assignments…");
  // A few assignments for the Mathematics group: a test due soon, practice on a topic, and an overdue unit.
  const mathGroup = groups.get("math")!.id;
  const inDays = (n: number) => new Date(Date.now() + n * DAY).toISOString().slice(0, 10);
  const assignedAt = new Date(Date.now() - 4 * DAY);
  const mathTopics = [...S("Mathematics").topics.entries()];
  const mathUnits = unitsBySubject.get("Mathematics") ?? [];
  const mathExam = exams.get("Mathematics");
  await db.assignment.createMany({
    data: [
      ...(mathExam ? [{ groupId: mathGroup, kind: "TEST", testId: mathExam.id, title: mathExam.title, dueOn: inDays(3), createdById: jasur.id, createdAt: assignedAt, note: "Timed, like the real exam. Review your mistakes afterwards." }] : []),
      ...(mathTopics[1] ? [{ groupId: mathGroup, kind: "PRACTICE", topicId: mathTopics[1][1], questions: 10, title: `${mathTopics[1][0]}: 10 practice questions`, dueOn: inDays(5), createdById: jasur.id, createdAt: assignedAt }] : []),
      ...(mathUnits[2] ? [{ groupId: mathGroup, kind: "UNIT", unitId: mathUnits[2].id, title: "Finish roadmap unit 3", dueOn: inDays(-1), createdById: jasur.id, createdAt: new Date(Date.now() - 9 * DAY) }] : []),
    ],
  });

  console.log("Website…");
  // The center's public website (/c/bright-future): courses, results, questions and a few trial lesson requests.
  const site = (kind: string, items: { title: string; subtitle?: string; meta?: string; body?: string }[]) =>
    items.map((item, order) => ({ ...item, centerId: center.id, kind, order }));
  await db.siteItem.createMany({
    data: [
      ...site("COURSE", [
        { title: "Mathematics", subtitle: "450 000 soʻm / month", meta: "Grades 5–11", body: "School maths from fractions to calculus, lyceum entrance exam and olympiad preparation." },
        { title: "General English", subtitle: "400 000 soʻm / month", meta: "A1 → B2", body: "Speaking, grammar and vocabulary in small groups, with a placement test before you start." },
        { title: "IELTS preparation", subtitle: "550 000 soʻm / month", meta: "Target 6.5+", body: "All four skills, weekly mock tests and personal feedback on your writing and speaking." },
        { title: "Physics", subtitle: "450 000 soʻm / month", meta: "Grades 7–11", body: "Mechanics, electricity and waves with problem-solving practice for school and university exams." },
        { title: "Chemistry & Biology", subtitle: "500 000 soʻm / month", meta: "Medical track", body: "Everything you need for medical university admissions, with regular timed tests." },
        { title: "Mental Arithmetic", subtitle: "300 000 soʻm / month", meta: "Ages 6–12", body: "Fast calculation, memory and concentration for younger students — lots of games." },
      ]),
      ...site("RESULT", [
        { title: "Madina Xolmatova", subtitle: "IELTS 8.0", body: "Admitted to a medical university in Europe with a scholarship" },
        { title: "Bekzod Aliyev", subtitle: "1st place", body: "Tashkent city physics olympiad" },
        { title: "Kamila Usmonova", subtitle: "IELTS 7.5", body: "After 8 months in the IELTS course" },
        { title: "Islom Qodirov", subtitle: "Grant", body: "Turin Polytechnic University in Tashkent, engineering" },
      ]),
      ...site("FAQ", [
        { title: "Is the first lesson really free?", body: "Yes. Book a free trial lesson below — you meet the teacher, see how the group works and only then decide." },
        { title: "How many students are in a group?", body: "8–12 students, so the teacher can check everyone's work in every lesson." },
        { title: "How do parents follow progress?", body: "Every student has an account with their attendance, grades, homework and test results. We also share a short report every week." },
        { title: "Can I pay monthly?", body: "Yes, courses are paid monthly. Brothers and sisters get 10% off." },
      ]),
    ],
  });
  await db.lead.createMany({
    data: [
      { centerId: center.id, name: "Shahlo Karimova", phone: "+998 90 123 45 67", course: "IELTS preparation", branch: "Yunusobod branch", time: "Weekdays after 17:00", message: "My daughter is in grade 10 and wants 7.0 by next summer.", createdAt: new Date(Date.now() - 2 * 3_600_000) },
      { centerId: center.id, name: "Aziz Tursunov", phone: "+998 93 555 12 34", course: "Mathematics", time: "Saturday morning", createdAt: new Date(Date.now() - 26 * 3_600_000) },
      { centerId: center.id, name: "Nargiza Aliyeva", phone: "+998 97 777 88 99", course: "Mental Arithmetic", branch: "Chilonzor branch", status: "CONTACTED", note: "Called. Trial lesson on Saturday at 10:00.", createdAt: new Date(Date.now() - 3 * DAY) },
    ],
  });

  console.log("CD IELTS mock…");
  // The sample test, two candidates, and one finished test waiting for an examiner (/mock/admin).
  const content = structuredClone(SAMPLE_CONTENT);
  if (existsSync(SAMPLE_TASK1_IMAGE)) {
    const chart = await db.mockFile.create({ data: { centerId: center.id, name: "sample-task1.png", mime: "image/png", size: statSync(SAMPLE_TASK1_IMAGE).size } });
    mkdirSync(path.join("data", "mock-files"), { recursive: true });
    copyFileSync(SAMPLE_TASK1_IMAGE, path.join("data", "mock-files", chart.id));
    content.writing[0].imageId = chart.id;
  }
  const mockTest = await db.mockTest.create({ data: { centerId: center.id, title: SAMPLE_TITLE, module: "ACADEMIC", content: JSON.stringify(content), published: true } });
  const pin = await bcrypt.hash("1234", 10);
  await db.mockCandidate.create({ data: { centerId: center.id, number: "100001", name: "Aziza Karimova", phone: "+998901110001", pinHash: pin } });
  const dilshod = await db.mockCandidate.create({ data: { centerId: center.id, number: "100002", name: "Dilshod Yusupov", phone: "+998901110002", pinHash: pin } });
  // His answers: most right, a few wrong, as a typical band-6 candidate.
  const lKey = parseSection(SAMPLE_CONTENT.listening.map((p) => p.questions)).key;
  const rKey = parseSection(SAMPLE_CONTENT.reading.map((p) => p.questions)).key;
  const answer = (key: typeof lKey, wrongEvery: number) =>
    Object.fromEntries(
      Object.entries(key).flatMap(([n, k]) => {
        if (Number(n) % wrongEvery === 0) return [[n, k.kind === "gap" ? "dont know" : k.kind === "judge" ? "NOT GIVEN" : "A"]];
        if (k.kind === "gap") return [[n, k.answers[0]]];
        if (k.kind === "multi") return Number(n) === k.ns[0] ? [[n, k.answers.join(",")]] : [];
        return [[n, k.answer]];
      }),
    );
  const L = answer(lKey, 4);
  const R = answer(rKey, 3);
  const lm = markAll(lKey, L);
  const rm = markAll(rKey, R);
  await db.mockAttempt.create({
    data: {
      centerId: center.id,
      testId: mockTest.id,
      candidateId: dilshod.id,
      section: "DONE",
      answers: JSON.stringify({ L, R }),
      writing: JSON.stringify({
        "1": "The bar chart compares the main ways people travelled to work in a European city in 1990 and 2020. Overall, the car remained the most common way to commute, but its share fell, while cycling and the train became much more popular.\n\nIn 1990, more than half of workers (52%) drove to work. By 2020 this figure had dropped to 38%, although driving was still the most popular choice. The bus and walking also became less common, falling from 18% to 14% and from 16% to 12% respectively.\n\nIn contrast, the proportion of people who cycled rose more than threefold, from just 6% to 19%, making the bicycle the second most popular way to travel in 2020. The train also grew in popularity, more than doubling from 8% to 17%.\n\nIn summary, although cars were still dominant, the city moved towards cycling and rail over the thirty years.",
        "2": "In many countries young people go straight from school to university or work. Some people think they should first spend some time doing unpaid work in their community. I partly agree with this idea, because it has clear benefits, but I do not think it should be compulsory for everyone.\n\nOn the one hand, community work teaches young people skills that school does not. For example, helping in a hospital or cleaning a park teaches responsibility and teamwork. Students also meet people from different backgrounds, which makes them more understanding. In addition, communities get help with important jobs that are often underfunded.\n\nOn the other hand, making it compulsory could cause problems. Some families need their children to start earning money as soon as possible, and a year without pay would be very difficult for them. Also, people who are forced to volunteer may not work hard, so the quality of the help could be low.\n\nIn conclusion, I believe community service is valuable and governments should encourage it, for example by giving university places or small grants to volunteers, but it should remain a free choice.",
      }),
      listeningRaw: lm.raw,
      readingRaw: rm.raw,
      listeningBand: band("LISTENING", lm.raw, lm.total),
      readingBand: band("READING", rm.raw, rm.total),
      startedAt: new Date(Date.now() - DAY - 3 * 3_600_000),
      finishedAt: new Date(Date.now() - DAY),
    },
  });

  console.log("\nDone. Demo logins (password: password123):");
  console.log("  student@demo.uz    – student");
  console.log("  teacher@demo.uz    – teacher (or log in with the teacher ID T1001)");
  console.log("  admin@demo.uz      – center admin");
  console.log("  Invite codes: DEMO24 (students), MATH9A (students, joins Mathematics · Grade 9 A), TEACH24 (teachers)");
  console.log("  owner@bislearn.uz  – platform owner");
  console.log("  CD IELTS mock (/mock): candidates 100001 and 100002, PIN 1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
