import { NextResponse, after } from "next/server";
import { db } from "@/lib/db";
import { getCandidate } from "@/lib/mock/session";
import { LISTENING_REVIEW_SECONDS, SECTIONS, type Section } from "@/lib/mock/format";
import { NEXT_SECTION, readAnswers, readWriting, scoreAttempt, sectionMinutes } from "@/lib/mock/tests";
import { aiMarkWriting } from "@/lib/mock/ai-mark";

// The exam screen's link to the server: starting a section, autosaving answers, the end of the
// listening recording, and finishing a section. Time is kept here, not in the browser: answers
// arriving after a section's time (plus a little slack for slow connections) are refused.
const GRACE_MS = 30_000;
const MAX_ANSWER = 200;
const MAX_ESSAY = 20_000;

type Body = { action?: string; section?: string; answers?: Record<string, unknown>; writing?: Record<string, unknown> };

function cleanAnswers(input: Record<string, unknown> | undefined) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input ?? {}).slice(0, 120)) {
    if (/^\d{1,3}$/.test(k) && typeof v === "string") out[k] = v.slice(0, MAX_ANSWER);
  }
  return out;
}

export async function POST(req: Request, { params }: RouteContext<"/api/mock/attempt/[id]">) {
  const { id } = await params;
  const candidate = await getCandidate();
  if (!candidate) return NextResponse.json({ error: "signed out" }, { status: 401 });
  const attempt = await db.mockAttempt.findUnique({ where: { id } });
  if (!attempt || attempt.candidateId !== candidate.id) return NextResponse.json({ error: "not found" }, { status: 404 });

  const parsed: unknown = await req.json().catch(() => null);
  const body = (parsed && typeof parsed === "object" ? parsed : {}) as Body;
  const now = Date.now();
  const state = () => db.mockAttempt.findUniqueOrThrow({ where: { id }, select: { section: true, sectionEndsAt: true } });
  const reply = async () => {
    const s = await state();
    return NextResponse.json({ section: s.section, endsAt: s.sectionEndsAt?.getTime() ?? null, now: Date.now() });
  };
  if (attempt.section === "DONE") return reply();

  const section = attempt.section as Section;
  const sameSection = body.section === section;
  const inTime = !!attempt.sectionStartedAt && (!attempt.sectionEndsAt || now <= attempt.sectionEndsAt.getTime() + GRACE_MS);
  const timeUp = !!attempt.sectionEndsAt && now > attempt.sectionEndsAt.getTime() + GRACE_MS;

  /** Keeps what the browser sent for the current section, if its time hasn't run out. */
  const saveData = async () => {
    if (!sameSection || !inTime) return;
    if (section === "WRITING" && body.writing) {
      const w = readWriting(attempt.writing);
      for (const k of ["1", "2"] as const) if (typeof body.writing[k] === "string") w[k] = (body.writing[k] as string).slice(0, MAX_ESSAY);
      await db.mockAttempt.update({ where: { id }, data: { writing: JSON.stringify(w) } });
    } else if (section !== "WRITING" && body.answers) {
      const all = readAnswers(attempt.answers);
      all[section === "LISTENING" ? "L" : "R"] = cleanAnswers(body.answers);
      await db.mockAttempt.update({ where: { id }, data: { answers: JSON.stringify(all) } });
    }
  };

  /** Moves on to the next section; after Writing the test is finished and marked. Only once, even
   * when the browser's "finish" and its time-up save arrive together. */
  const finishSection = async () => {
    const next = NEXT_SECTION[section];
    const moved = await db.mockAttempt.updateMany({
      where: { id, section },
      data: { section: next, sectionStartedAt: null, sectionEndsAt: null, ...(next === "DONE" ? { finishedAt: new Date() } : {}) },
    });
    if (moved.count && next === "DONE") {
      await scoreAttempt(id);
      after(() => aiMarkWriting(id));
    }
  };

  switch (body.action) {
    case "start":
      if (sameSection && !attempt.sectionStartedAt) {
        await db.mockAttempt.update({
          where: { id },
          data: { sectionStartedAt: new Date(now), sectionEndsAt: new Date(now + sectionMinutes(section) * 60_000) },
        });
      }
      return reply();
    case "save":
      if (timeUp) await finishSection();
      else await saveData();
      return reply();
    case "audioDone":
      // The recording has finished: two minutes to check answers, as in the real test.
      if (sameSection && section === "LISTENING" && attempt.sectionEndsAt && attempt.sectionStartedAt) {
        const review = now + LISTENING_REVIEW_SECONDS * 1000;
        if (review < attempt.sectionEndsAt.getTime()) await db.mockAttempt.update({ where: { id }, data: { sectionEndsAt: new Date(review) } });
      }
      return reply();
    case "finish":
      if (sameSection || timeUp) {
        await saveData();
        await finishSection();
      }
      return reply();
    default:
      if (!SECTIONS.includes(section)) return NextResponse.json({ error: "bad section" }, { status: 400 });
      return reply();
  }
}
