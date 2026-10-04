// Marking a CD IELTS mock: checks answers against the key and turns raw scores into bands with the
// published IELTS conversion tables. Writing and Speaking bands come from the examiner's (or the
// AI's) four criteria.
import type { Key } from "./format";

export type Answers = Record<string, string>;

/** Lower case, single spaces, no surrounding punctuation or quotes; "1,500" counts as "1500". */
export function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[‐-―−]/g, "-")
    .replace(/[“”"‘’`]/g, "'")
    .replace(/(\d),(?=\d{3}\b)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^'+|'+$/g, "")
    .replace(/[.,;:!?]+$/, "")
    .trim();
}

/** "(the) museum" accepts "the museum" and "museum". */
function variants(answer: string): string[] {
  const m = answer.match(/\(([^()]*)\)/);
  if (!m) return [answer.replace(/\s+/g, " ").trim()];
  const before = answer.slice(0, m.index);
  const after = answer.slice(m.index! + m[0].length);
  return [...variants(before + m[1] + after), ...variants(before + after)];
}

export function gapCorrect(answers: string[], given: string | undefined) {
  if (!given?.trim()) return false;
  const g = normalize(given);
  return answers.some((a) => variants(a).some((v) => normalize(v) === g));
}

/**
 * Marks every question: which numbers are right. "Choose TWO" questions store the chosen letters
 * under their first number ("A,C") and score one mark per correct letter.
 */
export function markAll(key: Record<number, Key>, answers: Answers) {
  const correct: Record<number, boolean> = {};
  const done = new Set<number>();
  for (const [num, k] of Object.entries(key)) {
    const n = Number(num);
    if (done.has(n)) continue;
    if (k.kind === "multi") {
      const chosen = new Set((answers[k.ns[0]] ?? "").split(",").map((s) => s.trim()).filter(Boolean));
      const right = k.answers.filter((a) => chosen.has(a)).length;
      // The exam screen allows only as many letters as asked; extra letters cost a mark each.
      const marks = Math.max(0, right - Math.max(0, chosen.size - k.ns.length));
      k.ns.forEach((q, i) => {
        correct[q] = i < marks;
        done.add(q);
      });
      continue;
    }
    const given = answers[n];
    if (k.kind === "gap") correct[n] = gapCorrect(k.answers, given);
    else correct[n] = (given ?? "").trim().toUpperCase() === k.answer.toUpperCase();
  }
  const raw = Object.values(correct).filter(Boolean).length;
  return { correct, raw, total: Object.keys(key).length };
}

/** The correct answer shown in the review, e.g. "Sarah / Sara" or "B". */
export function keyText(k: Key) {
  if (k.kind === "gap") return k.answers.join(" / ");
  if (k.kind === "multi") return k.answers.join(", ");
  return k.answer;
}

// Raw score (out of 40) needed for each band, highest first.
const LISTENING: [number, number][] = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [2, 1.5], [1, 1]];
const READING_ACADEMIC: [number, number][] = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [3, 2], [2, 1.5], [1, 1]];
const READING_GENERAL: [number, number][] = [[40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5], [23, 5], [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [4, 2], [2, 1.5], [1, 1]];

/** The band for a raw score. Tests with more or fewer than 40 questions are scaled to 40 first. */
export function band(section: "LISTENING" | "READING", raw: number, total: number, module = "ACADEMIC") {
  if (!total) return 0;
  const outOf40 = Math.round((raw / total) * 40);
  const table = section === "LISTENING" ? LISTENING : module === "GENERAL_TRAINING" ? READING_GENERAL : READING_ACADEMIC;
  return table.find(([min]) => outOf40 >= min)?.[1] ?? 0;
}

/** IELTS rounding: the average to the nearest half band, .25 and .75 rounding up. */
export function roundBand(value: number) {
  return Math.round(value * 2) / 2;
}

export const WRITING_CRITERIA = ["TA", "CC", "LR", "GRA"] as const;
export const SPEAKING_CRITERIA = ["FC", "LR", "GRA", "P"] as const;
export type WritingMarks = { t1: Record<(typeof WRITING_CRITERIA)[number], number>; t2: Record<(typeof WRITING_CRITERIA)[number], number>; comment?: string };
export type SpeakingMarks = Record<(typeof SPEAKING_CRITERIA)[number], number> & { comment?: string };

const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

/** Task 2 counts twice as much as Task 1; the result is rounded down to a half band. */
export function writingBand(marks: Pick<WritingMarks, "t1" | "t2">) {
  const t1 = mean(WRITING_CRITERIA.map((c) => marks.t1[c]));
  const t2 = mean(WRITING_CRITERIA.map((c) => marks.t2[c]));
  return Math.floor(((t1 + 2 * t2) / 3) * 2) / 2;
}

export function speakingBand(marks: SpeakingMarks) {
  return Math.floor(mean(SPEAKING_CRITERIA.map((c) => marks[c])) * 2) / 2;
}

/** The overall band once all four skills have a band. */
export function overallBand(bands: (number | null | undefined)[]) {
  if (bands.length !== 4 || bands.some((b) => b == null)) return null;
  return roundBand(mean(bands as number[]));
}
