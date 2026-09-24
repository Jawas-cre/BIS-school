/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateMath, mulberry32, shuffle, int, pick, type GenQuestion } from "./math";
import { generateRW } from "./rw";
import { UNIVERSITIES } from "./universities";
import { LIBRARY, PLATFORM_NEWS, ROADMAP, VOCAB_DECKS } from "./content";
import { domainOf, sectionScore, type Section } from "../../src/lib/sat";

const db = new PrismaClient();
const rng = mulberry32(42);
const DAY = 86_400_000;

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

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
  await db.user.deleteMany();
  await db.group.deleteMany();
  await db.branch.deleteMany();
  await db.center.deleteMany();
  await db.university.deleteMany();
}

type SeededQuestion = { id: string; section: Section; skill: string; difficulty: string; type: string; answer: string; choices: string };

async function seedQuestions(questions: GenQuestion[], centerId: string | null) {
  const out: SeededQuestion[] = [];
  for (const q of questions) {
    const row = await db.question.create({
      data: {
        centerId,
        section: q.section,
        domain: domainOf(q.section, q.skill),
        skill: q.skill,
        difficulty: q.difficulty,
        type: q.type,
        passage: q.passage ?? null,
        stem: q.stem,
        choices: JSON.stringify(q.choices ?? []),
        answer: q.answer,
        explanation: q.explanation,
      },
    });
    out.push({ id: row.id, section: q.section, skill: q.skill, difficulty: q.difficulty, type: q.type, answer: q.answer, choices: row.choices });
  }
  return out;
}

/** Picks n questions from a pool, easier ones first for a module-1 feel. */
function take(pool: SeededQuestion[], n: number, used: Set<string>, order: "easy-first" | "hard-first" | "mixed" = "mixed") {
  const rank = { EASY: 0, MEDIUM: 1, HARD: 2 } as Record<string, number>;
  const available = shuffle(rng, pool.filter((q) => !used.has(q.id)));
  const chosen = (available.length >= n ? available : shuffle(rng, pool)).slice(0, n);
  chosen.forEach((q) => used.add(q.id));
  if (order === "mixed") return chosen;
  return chosen.sort((a, b) => (order === "easy-first" ? rank[a.difficulty] - rank[b.difficulty] : rank[b.difficulty] - rank[a.difficulty]));
}

async function createTest(
  data: { title: string; description: string; kind: string; section?: Section; skill?: string; centerId?: string | null },
  modules: { section: Section; title: string; minutes: number; questions: SeededQuestion[] }[],
) {
  return db.test.create({
    data: {
      title: data.title,
      description: data.description,
      kind: data.kind,
      section: data.section ?? null,
      skill: data.skill ?? null,
      centerId: data.centerId ?? null,
      modules: {
        create: modules.map((m, i) => ({
          order: i,
          section: m.section,
          title: m.title,
          minutes: m.minutes,
          questions: { create: m.questions.map((q, j) => ({ questionId: q.id, order: j })) },
        })),
      },
    },
    include: { modules: { include: { questions: { include: { question: true } } } } },
  });
}

function wrongResponse(q: SeededQuestion) {
  if (q.type === "MCQ") return pick(rng, ["A", "B", "C", "D"].filter((l) => l !== q.answer));
  const n = Number(q.answer.split("|")[0]);
  return Number.isFinite(n) ? String(n + pick(rng, [-2, -1, 1, 3])) : "0";
}

async function main() {
  console.log("Resetting database…");
  await reset();

  console.log("Universities…");
  await db.university.createMany({ data: UNIVERSITIES.map((u, i) => ({ ...u, rank: i + 1 })) });
  const unis = await db.university.findMany({ orderBy: { rank: "asc" } });

  console.log("Question bank…");
  const rw = await seedQuestions(generateRW(), null);
  const math = await seedQuestions(generateMath(6), null);
  console.log(`  ${rw.length} reading & writing, ${math.length} math`);

  console.log("Mock tests…");
  const tests = [];
  for (const n of [1, 2]) {
    const used = new Set<string>();
    tests.push(
      await createTest(
        {
          title: `Full-Length Practice Test ${n}`,
          description: "A complete Digital SAT: two Reading & Writing modules and two Math modules with official timing. Includes a 10-minute break.",
          kind: "FULL",
        },
        [
          { section: "RW", title: "Reading and Writing — Module 1", minutes: 32, questions: take(rw, 27, used, "easy-first") },
          { section: "RW", title: "Reading and Writing — Module 2", minutes: 32, questions: take(rw, 27, used, "hard-first") },
          { section: "MATH", title: "Math — Module 1", minutes: 35, questions: take(math, 22, used, "easy-first") },
          { section: "MATH", title: "Math — Module 2", minutes: 35, questions: take(math, 22, used, "hard-first") },
        ],
      ),
    );
  }
  tests.push(
    await createTest(
      { title: "Reading & Writing Section Test", description: "One timed 27-question module covering every Reading & Writing domain.", kind: "SECTION", section: "RW" },
      [{ section: "RW", title: "Reading and Writing", minutes: 32, questions: take(rw, 27, new Set(), "easy-first") }],
    ),
    await createTest(
      { title: "Math Section Test", description: "One timed 22-question module covering algebra, advanced math, data analysis and geometry.", kind: "SECTION", section: "MATH" },
      [{ section: "MATH", title: "Math", minutes: 35, questions: take(math, 22, new Set(), "easy-first") }],
    ),
  );
  const skills = new Map<string, SeededQuestion[]>();
  for (const q of [...rw, ...math]) skills.set(q.skill, [...(skills.get(q.skill) ?? []), q]);
  for (const [skill, pool] of skills) {
    if (pool.length < 6) continue;
    const section = pool[0].section;
    const qs = take(pool, Math.min(10, pool.length), new Set(), "easy-first");
    await createTest(
      { title: skill, description: `${qs.length} questions focused on ${skill.toLowerCase()}.`, kind: "TOPIC", section, skill },
      [{ section, title: skill, minutes: Math.ceil(qs.length * (section === "MATH" ? 1.6 : 1.2)), questions: qs }],
    );
  }

  console.log("Roadmap, vocabulary, library, news…");
  const units = [];
  for (const [i, u] of ROADMAP.entries()) {
    units.push(await db.roadmapUnit.create({ data: { ...u, order: i } }));
  }
  const decks = [];
  for (const d of VOCAB_DECKS) {
    decks.push(
      await db.vocabDeck.create({
        data: {
          title: d.title,
          description: d.description,
          level: d.level,
          words: { create: d.words.map(([word, pos, definition, example, synonyms]) => ({ word, pos, definition, example, synonyms })) },
        },
        include: { words: true },
      }),
    );
  }
  await db.libraryItem.createMany({ data: LIBRARY });
  for (const [i, n] of PLATFORM_NEWS.entries()) {
    await db.newsPost.create({ data: { ...n, createdAt: new Date(Date.now() - (PLATFORM_NEWS.length - i) * 5 * DAY) } });
  }

  console.log("Accounts & demo center…");
  const hash = await bcrypt.hash("password123", 10);
  await db.user.create({ data: { email: "owner@bisprep.uz", name: "Platform Owner", passwordHash: hash, role: "SUPER_ADMIN", onboarded: true } });

  const center = await db.center.create({
    data: {
      name: "Bright Future Academy",
      slug: "bright-future",
      city: "Tashkent",
      about: "SAT and admissions preparation in Tashkent since 2019.",
      inviteCode: "DEMO24",
      accent: "#2563eb",
    },
  });
  const [chilonzor, yunusobod] = await Promise.all([
    db.branch.create({ data: { centerId: center.id, name: "Chilonzor branch", address: "Bunyodkor Ave 12, Tashkent", phone: "+998 71 200 12 12" } }),
    db.branch.create({ data: { centerId: center.id, name: "Yunusobod branch", address: "Amir Temur St 108, Tashkent", phone: "+998 71 200 34 34" } }),
  ]);
  await db.user.create({ data: { email: "admin@demo.uz", name: "Kamola Rashidova", passwordHash: hash, role: "CENTER_ADMIN", centerId: center.id, onboarded: true } });
  const teacherA = await db.user.create({ data: { email: "teacher@demo.uz", name: "Jasur Tursunov", passwordHash: hash, role: "TEACHER", centerId: center.id, branchId: chilonzor.id, onboarded: true } });
  const teacherB = await db.user.create({ data: { email: "teacher2@demo.uz", name: "Malika Yusupova", passwordHash: hash, role: "TEACHER", centerId: center.id, branchId: yunusobod.id, onboarded: true } });
  const groupA = await db.group.create({ data: { centerId: center.id, branchId: chilonzor.id, teacherId: teacherA.id, name: "SAT Intensive A1", schedule: "Mon / Wed / Fri · 16:00" } });
  const groupB = await db.group.create({ data: { centerId: center.id, branchId: yunusobod.id, teacherId: teacherB.id, name: "SAT Evening B2", schedule: "Tue / Thu / Sat · 18:30" } });

  await db.groupUnlock.createMany({ data: units.slice(0, 7).map((u) => ({ groupId: groupA.id, unitId: u.id })) });
  await db.groupUnlock.createMany({ data: units.slice(0, 4).map((u) => ({ groupId: groupB.id, unitId: u.id })) });

  await db.newsPost.create({
    data: {
      centerId: center.id,
      title: "Saturday mock exam at both branches",
      tag: "Event",
      pinned: true,
      body: "This Saturday at **10:00** we run a full-length mock exam in exam conditions at the Chilonzor and Yunusobod branches. Bring a charged laptop and arrive 15 minutes early. Results appear in your dashboard the same day.",
      createdAt: new Date(Date.now() - 2 * DAY),
    },
  });
  await db.newsPost.create({
    data: {
      centerId: center.id,
      title: "New vocabulary challenge",
      tag: "Announcement",
      body: "Master the **Core SAT Words** deck by the end of the month. Your teachers can see your progress in the Vocabulary section.",
      createdAt: new Date(Date.now() - 6 * DAY),
    },
  });

  const exam = new Date("2026-12-05T09:00:00+05:00");
  const students: { name: string; email: string; group: typeof groupA; ability: number; target: number }[] = [
    { name: "Aziza Karimova", email: "student@demo.uz", group: groupA, ability: 0.72, target: 1500 },
    { name: "Bekzod Aliyev", email: "bekzod@demo.uz", group: groupA, ability: 0.81, target: 1550 },
    { name: "Dilnoza Rahimova", email: "dilnoza@demo.uz", group: groupA, ability: 0.64, target: 1450 },
    { name: "Farrukh Nazarov", email: "farrukh@demo.uz", group: groupA, ability: 0.58, target: 1400 },
    { name: "Gulnora Saidova", email: "gulnora@demo.uz", group: groupA, ability: 0.77, target: 1520 },
    { name: "Islom Qodirov", email: "islom@demo.uz", group: groupA, ability: 0.69, target: 1480 },
    { name: "Jahongir Ergashev", email: "jahongir@demo.uz", group: groupA, ability: 0.52, target: 1350 },
    { name: "Kamila Usmonova", email: "kamila@demo.uz", group: groupB, ability: 0.74, target: 1500 },
    { name: "Laziz Mirzayev", email: "laziz@demo.uz", group: groupB, ability: 0.61, target: 1420 },
    { name: "Madina Xolmatova", email: "madina@demo.uz", group: groupB, ability: 0.85, target: 1560 },
    { name: "Nodir Sobirov", email: "nodir@demo.uz", group: groupB, ability: 0.55, target: 1380 },
    { name: "Oydin Hamidova", email: "oydin@demo.uz", group: groupB, ability: 0.67, target: 1450 },
    { name: "Rustam Jo'rayev", email: "rustam@demo.uz", group: groupB, ability: 0.6, target: 1400 },
    { name: "Sevara Ismoilova", email: "sevara@demo.uz", group: groupB, ability: 0.79, target: 1530 },
  ];

  const bank = [...rw, ...math];
  const fullTests = tests.filter((t) => t.kind === "FULL");
  const now = Date.now();
  const today = dayKey(new Date());

  for (const [si, s] of students.entries()) {
    const isDemo = si === 0;
    const user = await db.user.create({
      data: {
        email: s.email,
        name: s.name,
        passwordHash: hash,
        role: "STUDENT",
        centerId: center.id,
        branchId: s.group.branchId,
        groupId: s.group.id,
        onboarded: true,
        targetScore: s.target,
        examDate: exam,
        targetUniId: unis[int(rng, 0, 18)].id,
        phone: `+998 9${int(rng, 0, 9)} ${int(rng, 100, 999)} ${int(rng, 10, 99)} ${int(rng, 10, 99)}`,
        createdAt: new Date(now - 50 * DAY),
      },
    });

    // ── Daily practice over the last 45 days; the demo student has a 12-day streak ──
    const attempts: { userId: string; questionId: string; response: string; correct: boolean; seconds: number; source: string; createdAt: Date }[] = [];
    const days = new Map<string, { questions: number; correct: number; minutes: number }>();
    let streakDays = 0;
    for (let d = 44; d >= 0; d--) {
      const active = isDemo ? d < 12 || rng() < 0.6 : rng() < 0.35 + s.ability * 0.4;
      if (!active) continue;
      const date = new Date(now - d * DAY - int(rng, 0, 6) * 3_600_000);
      const n = int(rng, 6, 18);
      const progress = (44 - d) / 44; // accuracy improves over time
      let correct = 0;
      for (let i = 0; i < n; i++) {
        const q = pick(rng, bank);
        const p = Math.min(0.95, s.ability - 0.08 + progress * 0.14 - (q.difficulty === "HARD" ? 0.15 : q.difficulty === "EASY" ? -0.1 : 0));
        const ok = rng() < p;
        if (ok) correct++;
        attempts.push({ userId: user.id, questionId: q.id, response: ok ? q.answer.split("|")[0] : wrongResponse(q), correct: ok, seconds: int(rng, 25, 140), source: "BANK", createdAt: new Date(date.getTime() + i * 90_000) });
      }
      const key = dayKey(date);
      const prev = days.get(key) ?? { questions: 0, correct: 0, minutes: 0 };
      days.set(key, { questions: prev.questions + n, correct: prev.correct + correct, minutes: prev.minutes + Math.round(n * 1.4) });
    }

    // ── Completed full-length tests with an upward trend ──
    const testCount = isDemo ? 4 : int(rng, 1, 3);
    let lastTotal = 0;
    for (let t = 0; t < testCount; t++) {
      const test = fullTests[t % fullTests.length];
      const when = new Date(now - (38 - t * (isDemo ? 11 : 14)) * DAY);
      const skill = Math.min(0.97, s.ability - 0.12 + t * 0.05);
      const answers: Record<string, string> = {};
      const score = { RW: [0, 0], MATH: [0, 0] } as Record<Section, [number, number]>;
      for (const mod of test.modules) {
        for (const tq of mod.questions) {
          const q = { ...tq.question, section: tq.question.section as Section } as SeededQuestion;
          const ok = rng() < skill - (q.difficulty === "HARD" ? 0.1 : 0);
          const response = ok ? q.answer.split("|")[0] : wrongResponse(q);
          answers[q.id] = response;
          score[mod.section as Section][1]++;
          if (ok) score[mod.section as Section][0]++;
          attempts.push({ userId: user.id, questionId: q.id, response, correct: ok, seconds: int(rng, 40, 110), source: "TEST", createdAt: when });
        }
      }
      const rwScore = sectionScore(...score.RW);
      const mathScore = sectionScore(...score.MATH);
      lastTotal = rwScore + mathScore;
      await db.testAttempt.create({
        data: {
          userId: user.id,
          testId: test.id,
          status: "COMPLETED",
          moduleIndex: test.modules.length - 1,
          answers: JSON.stringify(answers),
          correct: score.RW[0] + score.MATH[0],
          total: score.RW[1] + score.MATH[1],
          rwScore,
          mathScore,
          totalScore: lastTotal,
          startedAt: when,
          moduleStarted: when,
          finishedAt: new Date(when.getTime() + 2.3 * 3_600_000),
        },
      });
    }

    await db.questionAttempt.createMany({ data: attempts });
    await db.activityDay.createMany({ data: [...days.entries()].map(([day, v]) => ({ userId: user.id, day, ...v })) });

    // Streak from the most recent consecutive active days.
    const keys = new Set(days.keys());
    let cursor = new Date();
    if (!keys.has(today)) cursor = new Date(now - DAY);
    while (keys.has(dayKey(cursor))) {
      streakDays++;
      cursor = new Date(cursor.getTime() - DAY);
    }
    const lastActive = [...keys].sort().pop() ?? null;
    const totalCorrect = attempts.filter((a) => a.correct).length;

    // ── Roadmap progress and vocabulary ──
    const unitsDone = isDemo ? 5 : int(rng, 1, 6);
    for (const u of units.slice(0, unitsDone)) {
      await db.unitProgress.create({ data: { userId: user.id, unitId: u.id, quizScore: int(rng, 60, 100), completedAt: new Date(now - int(rng, 1, 30) * DAY) } });
    }
    const wordsSeen = decks[0].words.slice(0, isDemo ? 18 : int(rng, 4, 20));
    await db.userWord.createMany({
      data: wordsSeen.map((w) => ({ userId: user.id, wordId: w.id, box: int(rng, 1, 5), nextReview: new Date(now + int(rng, -2, 5) * DAY) })),
    });

    await db.user.update({
      where: { id: user.id },
      data: {
        streak: streakDays,
        bestStreak: Math.max(streakDays, int(rng, streakDays, streakDays + 9)),
        lastActiveOn: lastActive,
        xp: totalCorrect * 10 + attempts.length * 2 + unitsDone * 50,
      },
    });
    if (isDemo) console.log(`  demo student: latest score ${lastTotal}, streak ${streakDays}`);
  }

  console.log("\nDone. Demo logins (password: password123):");
  console.log("  student@demo.uz   – student");
  console.log("  teacher@demo.uz   – teacher");
  console.log("  admin@demo.uz     – center admin (invite code DEMO24)");
  console.log("  owner@bisprep.uz  – platform super admin");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
