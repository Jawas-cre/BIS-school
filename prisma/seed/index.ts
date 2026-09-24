import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateMath, mulberry32, shuffle, int, pick, type GenQuestion } from "./math";
import { generateEnglish } from "./rw";
import { generateArithmetic, generateBiology, generateChemistry, generateComputerScience, generateHistory, generatePhysics } from "./science";
import { UNIVERSITIES } from "./universities";
import { LIBRARY, PLATFORM_NEWS, ROADMAP, SUBJECTS, VOCAB_DECKS } from "./content";

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
    console.log("Open the site to create your own center and admin password.");
    return;
  }

  console.log("Accounts & demo center…");
  const hash = await bcrypt.hash("password123", 10);
  await db.user.create({ data: { email: "owner@bislearn.uz", name: "Platform Owner", passwordHash: hash, role: "SUPER_ADMIN", onboarded: true } });

  const center = await db.center.create({
    data: { name: "Bright Future Academy", slug: "bright-future", city: "Tashkent", about: "Mathematics, sciences and languages for school students in Tashkent since 2019.", inviteCode: "DEMO24", accent: "#2563eb" },
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
  const jasur = await db.user.create({ data: { email: "teacher@demo.uz", name: "Jasur Tursunov", passwordHash: hash, role: "TEACHER", centerId: center.id, branchId: chilonzor.id, onboarded: true } });
  const malika = await db.user.create({ data: { email: "teacher2@demo.uz", name: "Malika Yusupova", passwordHash: hash, role: "TEACHER", centerId: center.id, branchId: yunusobod.id, onboarded: true } });
  const otabek = await db.user.create({ data: { email: "teacher3@demo.uz", name: "Otabek Rahimov", passwordHash: hash, role: "TEACHER", centerId: center.id, branchId: chilonzor.id, onboarded: true } });

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

  console.log("\nDone. Demo logins (password: password123):");
  console.log("  student@demo.uz    – student");
  console.log("  teacher@demo.uz    – teacher");
  console.log("  admin@demo.uz      – center admin");
  console.log("  Invite codes: DEMO24 (students), MATH9A (students, joins Mathematics · Grade 9 A), TEACH24 (teachers)");
  console.log("  owner@bislearn.uz  – platform owner");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
