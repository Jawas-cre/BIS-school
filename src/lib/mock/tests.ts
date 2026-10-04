import "server-only";
import { db } from "@/lib/db";
import {
  emptyContent,
  LISTENING_REVIEW_SECONDS,
  parseScript,
  parseSection,
  passageParagraphs,
  SECTION_MINUTES,
  type MockContent,
  type Section,
} from "./format";
import { band, markAll, overallBand, type Answers } from "./score";

/** A saved test's content, with missing parts filled in so older or partial tests still open. */
export function readContent(json: string): MockContent {
  const base = emptyContent();
  try {
    const c = JSON.parse(json) as Partial<MockContent>;
    return {
      listening: base.listening.map((p, i) => ({ ...p, ...c.listening?.[i] })),
      reading: base.reading.map((p, i) => ({ ...p, ...c.reading?.[i] })),
      writing: base.writing.map((t, i) => ({ ...t, ...c.writing?.[i] })),
    };
  } catch {
    return base;
  }
}

export function sectionKeys(content: MockContent) {
  return {
    listening: parseSection(content.listening.map((p) => p.questions)),
    reading: parseSection(content.reading.map((p) => p.questions)),
  };
}

export const mediaUrl = (id: string) => `/api/mock/media/${id}`;

/** What the exam screen gets: the questions without their answers. */
export function publicTest(content: MockContent) {
  const { listening, reading } = sectionKeys(content);
  return {
    listening: content.listening.map((p, i) => ({
      audio: p.audioId ? mediaUrl(p.audioId) : null,
      script: !p.audioId && p.script?.trim() ? parseScript(p.script) : null,
      ...listening.parts[i],
      errors: undefined,
    })),
    reading: content.reading.map((p, i) => ({ title: p.title, paragraphs: passageParagraphs(p), ...reading.parts[i], errors: undefined })),
    writing: content.writing.map((t) => ({ prompt: t.prompt, image: t.imageId ? mediaUrl(t.imageId) : null, minWords: t.minWords })),
    totals: { listening: listening.total, reading: reading.total },
  };
}
export type PublicTest = ReturnType<typeof publicTest>;

export type AttemptAnswers = { L: Answers; R: Answers };
export function readAnswers(json: string): AttemptAnswers {
  try {
    const a = JSON.parse(json);
    return { L: a?.L ?? {}, R: a?.R ?? {} };
  } catch {
    return { L: {}, R: {} };
  }
}
export function readWriting(json: string): Record<"1" | "2", string> {
  try {
    const w = JSON.parse(json);
    return { "1": typeof w?.["1"] === "string" ? w["1"] : "", "2": typeof w?.["2"] === "string" ? w["2"] : "" };
  } catch {
    return { "1": "", "2": "" };
  }
}

export const NEXT_SECTION: Record<Section, Section | "DONE"> = { LISTENING: "READING", READING: "WRITING", WRITING: "DONE" };
/** Listening's hard limit: its 30 minutes plus the 2 minutes to check answers, and a little slack for loading. */
export const LISTENING_CAP_MINUTES = SECTION_MINUTES.LISTENING + LISTENING_REVIEW_SECONDS / 60 + 8;
export const sectionMinutes = (section: Section) => (section === "LISTENING" ? LISTENING_CAP_MINUTES : SECTION_MINUTES[section]);

/** Marks Listening and Reading once the test is finished, and works out the overall band if possible. */
export async function scoreAttempt(attemptId: string) {
  const attempt = await db.mockAttempt.findUnique({ where: { id: attemptId }, include: { test: true } });
  if (!attempt) return null;
  const content = readContent(attempt.test.content);
  const keys = sectionKeys(content);
  const answers = readAnswers(attempt.answers);
  const l = markAll(keys.listening.key, answers.L);
  const r = markAll(keys.reading.key, answers.R);
  const listeningBand = band("LISTENING", l.raw, l.total);
  const readingBand = band("READING", r.raw, r.total, attempt.test.module);
  return db.mockAttempt.update({
    where: { id: attemptId },
    data: {
      listeningRaw: l.raw,
      readingRaw: r.raw,
      listeningBand,
      readingBand,
      overallBand: overallBand([listeningBand, readingBand, attempt.writingBand, attempt.speakingBand]),
    },
  });
}
