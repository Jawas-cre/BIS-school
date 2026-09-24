// Question helpers shared by server and client (answer checking, choices, difficulty).

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const LETTERS = ["A", "B", "C", "D"];

export function parseChoices(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function asNumber(s: string) {
  const t = s.replace(/\s+/g, "").replace(",", ".");
  if (/^-?\d+\/\d+$/.test(t)) {
    const [n, d] = t.split("/").map(Number);
    return d ? n / d : NaN;
  }
  return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : NaN;
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!]$/, "");

/**
 * Compares a student's response with the answer key.
 * MCQ keys are a letter. SHORT keys list accepted answers separated by "|":
 * numbers match within a small tolerance (so 0.667 matches 2/3), text matches
 * case-insensitively.
 */
export function isCorrect(type: string, answer: string, response: string): boolean {
  const given = response.trim();
  if (!given) return false;
  if (type === "MCQ") return given.toUpperCase() === answer.trim().toUpperCase();
  return answer.split("|").some((raw) => {
    const a = raw.trim();
    const x = asNumber(a);
    const y = asNumber(given);
    if (Number.isFinite(x) && Number.isFinite(y)) return Math.abs(x - y) < 5e-4 * Math.max(1, Math.abs(x));
    return normalize(a) === normalize(given);
  });
}
