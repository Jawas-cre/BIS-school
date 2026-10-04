import "server-only";
import { db } from "@/lib/db";
import { aiClient, aiSettings } from "@/lib/ai";
import { readContent, readWriting } from "./tests";
import { WRITING_CRITERIA, type WritingMarks } from "./score";

// An AI estimate of the Writing band, through the same connection as the AI tutor (Claude or
// OmniRoute). It's only a suggestion: a teacher confirms or changes it before the candidate sees it.

export type AiWriting = WritingMarks & { feedback1?: string; feedback2?: string; error?: string; model?: string };

const SYSTEM = `You are an experienced IELTS Writing examiner. Mark the candidate's two responses with the public IELTS Writing band descriptors.

For each task give a whole-number band from 0 to 9 for each criterion:
- TA: Task Achievement (Task 1) or Task Response (Task 2)
- CC: Coherence and Cohesion
- LR: Lexical Resource
- GRA: Grammatical Range and Accuracy

Apply the usual penalties: responses under the minimum word count, off-topic or memorised text, and a blank task scores 0.
Then give short, practical feedback for each task (3–5 sentences: the main strengths, the main problems, and what to do to reach the next band).

Reply with only this JSON, no other text:
{"t1":{"TA":0,"CC":0,"LR":0,"GRA":0},"t2":{"TA":0,"CC":0,"LR":0,"GRA":0},"feedback1":"...","feedback2":"..."}`;

function band(value: unknown) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(9, Math.max(0, n)) : 0;
}

/** Reads the first JSON object in the reply; models sometimes wrap it in text or a code block. */
function parseReply(text: string): AiWriting | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const raw = JSON.parse(text.slice(start, end + 1));
    const task = (t: Record<string, unknown> | undefined) => Object.fromEntries(WRITING_CRITERIA.map((c) => [c, band(t?.[c])])) as WritingMarks["t1"];
    return { t1: task(raw.t1), t2: task(raw.t2), feedback1: String(raw.feedback1 ?? "").slice(0, 2000), feedback2: String(raw.feedback2 ?? "").slice(0, 2000) };
  } catch {
    return null;
  }
}

export async function aiMarkWriting(attemptId: string) {
  const attempt = await db.mockAttempt.findUnique({ where: { id: attemptId }, include: { test: true } });
  if (!attempt) return;
  const settings = await aiSettings();
  if (settings.provider === "off") return;
  const tasks = readContent(attempt.test.content).writing;
  const writing = readWriting(attempt.writing);
  const model = settings.provider === "omniroute" ? settings.omnirouteModel : settings.claudeModel;
  const words = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
  const prompt = [1, 2]
    .map((i) => {
      const k = String(i) as "1" | "2";
      const task = tasks[i - 1];
      return `<task${i} min_words="${task.minWords}">\n${task.prompt}${task.imageId ? "\n(The task includes a chart or picture the candidate could see; judge the description from the text.)" : ""}\n</task${i}>\n<response${i} words="${words(writing[k])}">\n${writing[k] || "(blank)"}\n</response${i}>`;
    })
    .join("\n\n");
  let result: AiWriting;
  try {
    const res = await aiClient(settings).messages.create(
      { model, max_tokens: 3000, system: SYSTEM, messages: [{ role: "user", content: `${prompt}\n\nMark both responses now.` }] },
      { timeout: 180_000 },
    );
    const text = res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    result = { ...(parseReply(text) ?? { t1: zero(), t2: zero(), error: "The AI's answer couldn't be read." }), model: res.model || model };
  } catch (error) {
    result = { t1: zero(), t2: zero(), error: error instanceof Error ? error.message.slice(0, 300) : String(error) };
  }
  await db.mockAttempt.update({ where: { id: attemptId }, data: { writingAi: JSON.stringify(result) } });
}

const zero = () => ({ TA: 0, CC: 0, LR: 0, GRA: 0 });
