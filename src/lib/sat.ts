// Digital SAT content taxonomy and scoring helpers (shared by server and client).

export type Section = "MATH" | "RW";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export const SECTION_LABEL: Record<Section, string> = {
  RW: "Reading & Writing",
  MATH: "Math",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export const TAXONOMY: Record<Section, { domain: string; skills: string[] }[]> = {
  RW: [
    {
      domain: "Information and Ideas",
      skills: [
        "Central Ideas and Details",
        "Command of Evidence",
        "Inferences",
      ],
    },
    {
      domain: "Craft and Structure",
      skills: ["Words in Context", "Text Structure and Purpose", "Cross-Text Connections"],
    },
    {
      domain: "Expression of Ideas",
      skills: ["Rhetorical Synthesis", "Transitions"],
    },
    {
      domain: "Standard English Conventions",
      skills: ["Boundaries", "Form, Structure, and Sense"],
    },
  ],
  MATH: [
    {
      domain: "Algebra",
      skills: [
        "Linear equations in one variable",
        "Linear functions",
        "Linear equations in two variables",
        "Systems of linear equations",
        "Linear inequalities",
      ],
    },
    {
      domain: "Advanced Math",
      skills: ["Nonlinear functions", "Nonlinear equations", "Equivalent expressions"],
    },
    {
      domain: "Problem-Solving and Data Analysis",
      skills: [
        "Ratios, rates, and proportions",
        "Percentages",
        "One-variable data",
        "Two-variable data",
        "Probability",
      ],
    },
    {
      domain: "Geometry and Trigonometry",
      skills: [
        "Area and volume",
        "Lines, angles, and triangles",
        "Right triangles and trigonometry",
        "Circles",
      ],
    },
  ],
};

export function domainOf(section: Section, skill: string): string {
  return TAXONOMY[section].find((d) => d.skills.includes(skill))?.domain ?? "";
}

export const ALL_SKILLS = (Object.keys(TAXONOMY) as Section[]).flatMap((section) =>
  TAXONOMY[section].flatMap((d) => d.skills.map((skill) => ({ section, domain: d.domain, skill }))),
);

/** Scaled section score (200–800) from a raw result, rounded to the nearest 10. */
export function sectionScore(correct: number, total: number): number {
  if (total === 0) return 200;
  const ratio = correct / total;
  // Slight curve: the top of the scale is harder to reach than the middle.
  const curved = Math.pow(ratio, 1.15);
  return Math.round((200 + 600 * curved) / 10) * 10;
}

export function parseChoices(raw: string): string[] {
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

export const LETTERS = ["A", "B", "C", "D"];

/** Compare a student response with the stored answer key. */
export function isCorrect(type: string, answer: string, response: string): boolean {
  const given = response.trim();
  if (!given) return false;
  if (type === "MCQ") return given.toUpperCase() === answer.trim().toUpperCase();
  const accepted = answer.split("|").map((a) => a.trim());
  const asNumber = (s: string) => {
    if (s.includes("/")) {
      const [n, d] = s.split("/").map(Number);
      return d ? n / d : NaN;
    }
    return Number(s);
  };
  return accepted.some((a) => {
    if (a === given) return true;
    const x = asNumber(a);
    const y = asNumber(given);
    // Truncated/rounded decimals such as .6666 or .6667 for 2/3 are accepted.
    return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) < 5e-4;
  });
}
