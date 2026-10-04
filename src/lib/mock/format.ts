// The CD IELTS mock test: what a test contains, and the plain-text format teachers write questions
// in. Shared by the editor's live preview, the exam screen and the marking, so nothing here is
// server-only. Answer keys are returned separately from the questions, so the exam screen can be
// sent the questions without the answers.
//
// Question format (one group of questions per "##"):
//
//   ## Questions 1–5                      starts a group; the numbers are worked out automatically
//   Complete the notes below.             the first lines after ## are the instructions
//   Write ONE WORD AND/OR A NUMBER for each answer.
//                                         a blank line ends the instructions
//   ### Hotel booking                     a heading inside the questions
//   Name of guest: [Sarah]                [answer] is an answer box; [colour|color] accepts either;
//   Nights: [3|three]                     (the) makes a word optional: [(the) museum]
//   - Breakfast at [7.30]                 "- " is a bullet point
//   | Day | Activity |                    a table; answer boxes work inside cells
//   | Monday | [swimming] |
//
//   ? What does the speaker recommend?    a multiple-choice question; * marks the correct option
//   A. the bus
//   B. the train *
//   C. a taxi
//
//   ? Which TWO facilities are free?      two or more * : "choose TWO" (one mark per correct letter)
//   A. parking *   B. ...                 (one option per line)
//
//   ? The museum opened in 1990. = FALSE  TRUE / FALSE / NOT GIVEN (or YES / NO / NOT GIVEN)
//
//   Options:                              matching: the list to choose from…
//   A. Dr Smith
//   B. Prof. Jones
//   ? invented the device = B             …and one line per question with its answer

export type Segment = string | { gap: number };
export type Choice = { key: string; text: string };

/** A question as the candidate sees it: never includes the answer. */
export type Question =
  | { kind: "choice"; n: number; prompt: string; options: Choice[] }
  | { kind: "multi"; ns: number[]; prompt: string; options: Choice[] }
  | { kind: "judge"; n: number; prompt: string; scale: "TFNG" | "YNNG" }
  | { kind: "match"; n: number; prompt: string };

export type Block =
  | { type: "text"; segments: Segment[]; style?: "heading" | "bullet" }
  | { type: "space" }
  | { type: "table"; rows: Segment[][][] }
  | { type: "question"; question: Question };

export type Group = { from: number; to: number; heading?: string; instructions: string[]; options: Choice[]; blocks: Block[] };

/** The answer key for one question number. */
export type Key =
  | { kind: "gap"; answers: string[] }
  | { kind: "choice"; answer: string }
  | { kind: "multi"; ns: number[]; answers: string[] }
  | { kind: "judge"; answer: string }
  | { kind: "match"; answer: string };

export type ParseError = { line: number; message: string };
export type Parsed = { groups: Group[]; key: Record<number, Key>; next: number; errors: ParseError[] };

export type ListeningPart = { audioId?: string | null; script?: string; questions: string };
export type ReadingPassage = { title: string; text: string; labels?: boolean; questions: string };
export type WritingTask = { prompt: string; imageId?: string | null; minWords: number };
export type MockContent = { listening: ListeningPart[]; reading: ReadingPassage[]; writing: WritingTask[] };

export const SECTIONS = ["LISTENING", "READING", "WRITING"] as const;
export type Section = (typeof SECTIONS)[number];
/** Minutes per section. Listening also gets 2 minutes at the end to check answers. */
export const SECTION_MINUTES = { LISTENING: 30, READING: 60, WRITING: 60 } as const;
export const LISTENING_REVIEW_SECONDS = 120;

export function emptyContent(): MockContent {
  return {
    listening: Array.from({ length: 4 }, () => ({ audioId: null, script: "", questions: "" })),
    reading: Array.from({ length: 3 }, () => ({ title: "", text: "", labels: false, questions: "" })),
    writing: [
      { prompt: "", imageId: null, minWords: 150 },
      { prompt: "", imageId: null, minWords: 250 },
    ],
  };
}

const GAP = /(?<!\\)\[([^\]\n]+)\]/g;
const HAS_GAP = /(?<!\\)\[[^\]\n]+\]/;
const OPTION = /^([A-J])[.)]\s+(.+?)(\s*\*)?\s*$/;
const LIST_OPTION = /^([A-J]|[ivx]{1,4})[.)]\s+(.+?)\s*$/;
const JUDGE: Record<string, string> = { TRUE: "TRUE", FALSE: "FALSE", "NOT GIVEN": "NOT GIVEN", NG: "NOT GIVEN", YES: "YES", NO: "NO" };

/** Reads one part's questions. Numbering starts at `first` and continues across parts. */
export function parseQuestions(source: string, first = 1): Parsed {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const groups: Group[] = [];
  const key: Record<number, Key> = {};
  const errors: ParseError[] = [];
  let n = first;
  let group: Group | null = null;
  let collectingInstructions = false;
  let collectingOptions = false;

  const startGroup = (heading?: string) => {
    group = { from: n, to: n - 1, heading, instructions: [], options: [], blocks: [] };
    groups.push(group);
  };
  const current = (): Group => {
    if (!group) startGroup();
    return group!;
  };
  /** Splits a line into text and numbered answer boxes, recording each box's answers. */
  const segments = (text: string): Segment[] => {
    const out: Segment[] = [];
    let last = 0;
    for (const m of text.matchAll(GAP)) {
      if (m.index! > last) out.push(unescape(text.slice(last, m.index)));
      const answers = m[1].split("|").map((a) => a.trim()).filter(Boolean);
      key[n] = { kind: "gap", answers };
      out.push({ gap: n++ });
      last = m.index! + m[0].length;
    }
    if (last < text.length) out.push(unescape(text.slice(last)));
    return out;
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    const lineNo = i + 1;

    if (line.startsWith("## ")) {
      const heading = line.slice(3).trim();
      startGroup(/^questions?\s*[\d\s–—-]*(and\s*\d+)?$/i.test(heading) ? undefined : heading);
      collectingInstructions = true;
      collectingOptions = false;
      continue;
    }
    if (!line) {
      collectingInstructions = false;
      collectingOptions = false;
      const g = current();
      if (g.blocks.length && g.blocks.at(-1)!.type !== "space") g.blocks.push({ type: "space" });
      continue;
    }
    // Instructions end at the first question, list, table, heading or answer box, even without a blank line.
    if (collectingInstructions && !/^(\?|\||###\s|[-•]\s|options:?$)/i.test(line) && !HAS_GAP.test(line)) {
      current().instructions.push(line);
      continue;
    }
    collectingInstructions = false;
    if (/^options:?$/i.test(line)) {
      collectingOptions = true;
      continue;
    }
    if (collectingOptions) {
      const m = line.match(LIST_OPTION);
      if (m) {
        current().options.push({ key: m[1], text: m[2] });
        continue;
      }
      collectingOptions = false;
    }

    if (line.startsWith("?")) {
      const g = current();
      const body = line.slice(1).trim();
      const eq = body.match(/^(.+?)\s*=\s*([^=]+)$/);
      if (eq) {
        const [, prompt, rawAnswer] = eq;
        const answer = rawAnswer.trim();
        const judge = JUDGE[answer.toUpperCase()];
        if (judge) {
          key[n] = { kind: "judge", answer: judge };
          g.blocks.push({ type: "question", question: { kind: "judge", n: n++, prompt, scale: "TFNG" } });
        } else {
          if (!g.options.length) errors.push({ line: lineNo, message: `"${answer}" isn't TRUE, FALSE, NOT GIVEN, YES or NO, and this group has no "Options:" list to match from.` });
          else if (!g.options.some((o) => o.key === answer)) errors.push({ line: lineNo, message: `The answer "${answer}" isn't one of the options (${g.options.map((o) => o.key).join(", ")}).` });
          key[n] = { kind: "match", answer };
          g.blocks.push({ type: "question", question: { kind: "match", n: n++, prompt } });
        }
        continue;
      }
      // Multiple choice: the option lines follow.
      const options: Choice[] = [];
      const correct: string[] = [];
      while (i + 1 < lines.length) {
        const m = lines[i + 1].trim().match(OPTION);
        if (!m) break;
        options.push({ key: m[1], text: m[2] });
        if (m[3]) correct.push(m[1]);
        i++;
      }
      if (options.length < 2) {
        errors.push({ line: lineNo, message: "A multiple-choice question needs its options on the next lines, e.g. \"A. the bus\"." });
        continue;
      }
      if (!correct.length) {
        errors.push({ line: lineNo, message: "Mark the correct option with * at the end of its line." });
        continue;
      }
      if (correct.length === 1) {
        key[n] = { kind: "choice", answer: correct[0] };
        g.blocks.push({ type: "question", question: { kind: "choice", n: n++, prompt: body, options } });
      } else {
        const ns = correct.map(() => n++);
        for (const q of ns) key[q] = { kind: "multi", ns, answers: correct };
        g.blocks.push({ type: "question", question: { kind: "multi", ns, prompt: body, options } });
      }
      continue;
    }

    const g = current();
    if (line.startsWith("|")) {
      const cells = line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // a markdown separator row
      const row = cells.map((c) => segments(c));
      const last = g.blocks.at(-1);
      if (last?.type === "table") last.rows.push(row);
      else g.blocks.push({ type: "table", rows: [row] });
      continue;
    }
    if (line.startsWith("### ")) g.blocks.push({ type: "text", segments: segments(line.slice(4)), style: "heading" });
    else if (/^[-•]\s+/.test(line)) g.blocks.push({ type: "text", segments: segments(line.replace(/^[-•]\s+/, "")), style: "bullet" });
    else g.blocks.push({ type: "text", segments: segments(line) });
  }

  for (const g of groups as Group[]) {
    g.to = Math.max(g.from - 1, ...g.blocks.flatMap(blockNumbers));
    // TRUE/FALSE/NOT GIVEN or YES/NO/NOT GIVEN: whichever the group's answers use.
    const usesYes = g.blocks.some((b) => b.type === "question" && b.question.kind === "judge" && ["YES", "NO"].includes((key[b.question.n] as { answer: string }).answer));
    for (const b of g.blocks) if (b.type === "question" && b.question.kind === "judge") b.question.scale = usesYes ? "YNNG" : "TFNG";
    while (g.blocks.at(-1)?.type === "space") g.blocks.pop();
  }
  return { groups: groups.filter((g) => g.blocks.length || g.instructions.length), key, next: n, errors };
}

function unescape(text: string) {
  return text.replace(/\\\[/g, "[");
}

function blockNumbers(b: Block): number[] {
  if (b.type === "question") return b.question.kind === "multi" ? b.question.ns : [b.question.n];
  if (b.type === "text") return b.segments.flatMap((s) => (typeof s === "string" ? [] : [s.gap]));
  if (b.type === "table") return b.rows.flat(2).flatMap((s) => (typeof s === "string" ? [] : [s.gap]));
  return [];
}

export type ParsedPart = { groups: Group[]; from: number; to: number; errors: ParseError[] };

/** All parts of a listening or reading section, numbered 1, 2, 3… straight through. */
export function parseSection(sources: string[]) {
  const key: Record<number, Key> = {};
  const parts: ParsedPart[] = [];
  let n = 1;
  for (const source of sources) {
    const parsed = parseQuestions(source ?? "", n);
    parts.push({ groups: parsed.groups, from: n, to: parsed.next - 1, errors: parsed.errors });
    Object.assign(key, parsed.key);
    n = parsed.next;
  }
  return { parts, key, total: n - 1 };
}

/** The passage's paragraphs (separated by blank lines), labelled A, B, C… when asked. */
export function passageParagraphs(passage: Pick<ReadingPassage, "text" | "labels">) {
  return passage.text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((text, i) => ({ label: passage.labels ? String.fromCharCode(65 + i) : null, text }));
}

/**
 * A listening script read aloud by the computer: "Name: words" lines for the speakers, lines
 * without a name for the narrator, and (pause 20) for 20 seconds of silence.
 */
export type ScriptLine = { speaker: string; text: string } | { pause: number };
export function parseScript(script: string): ScriptLine[] {
  const out: ScriptLine[] = [];
  for (const raw of script.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const pause = line.match(/^\(pause\s+(\d{1,3})\)$/i);
    if (pause) {
      out.push({ pause: Number(pause[1]) });
      continue;
    }
    const said = line.match(/^([A-Z][\w .'-]{0,30}):\s+(.+)$/);
    out.push(said ? { speaker: said[1].trim(), text: said[2] } : { speaker: "Narrator", text: line });
  }
  return out;
}

export function wordCount(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}
