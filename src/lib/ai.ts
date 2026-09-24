import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { PLATFORM_NAME } from "@/lib/brand";

export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";
export const AI_DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || 60);
/** How many earlier messages are sent back to the model with each turn. */
export const AI_HISTORY_LIMIT = 40;

let client: Anthropic | null = null;
export function anthropic() {
  // Credentials resolve from ANTHROPIC_API_KEY (or another SDK-supported source).
  client ??= new Anthropic();
  return client;
}

// Kept byte-for-byte stable so it can be served from the prompt cache.
export const TUTOR_SYSTEM = `You are the AI tutor inside ${PLATFORM_NAME}, a Digital SAT preparation platform used by learning centers. Your students are mostly high-school students in Central Asia preparing for the SAT; many speak English as a second language.

How to help:
- Teach, don't just answer. When a student shares a question, walk through the reasoning step by step, name the SAT skill being tested, and point out the trap in tempting wrong choices.
- For math, show each algebraic step with LaTeX between $...$ (inline) or $$...$$ (display). Mention faster approaches (plugging in, Desmos, working backwards) when they would save time on test day.
- For Reading & Writing, quote the exact words in the passage that justify the answer, and explain the grammar rule or logic for conventions and transitions questions.
- Keep explanations clear and concise, in plain English. If the student writes in Uzbek or Russian, you may answer in that language.
- When asked for practice, write original SAT-style questions (never claim they are official College Board questions) and hold the answer key until the student has tried.
- For study plans, be concrete: weekly goals, which skills to drill, and how many timed practice sets to take.
- You can discuss college admissions and scholarships in general terms, but tell students to confirm deadlines, requirements and figures on official websites.
- Stay on topics related to learning, the SAT and university admissions. Politely decline requests to do graded homework dishonestly or anything unrelated to studying.
- Format answers in Markdown with short paragraphs, lists and bold key terms. Do not include internal or system XML tags in your response.`;

export function studentContext(user: {
  name: string;
  targetScore: number | null;
  examDate: Date | null;
  latestScore: number | null;
  weakest: string[];
  centerName: string | null;
}) {
  const lines = [
    `Student: ${user.name.split(" ")[0]}`,
    user.centerName && `Learning center: ${user.centerName}`,
    user.targetScore && `Target SAT score: ${user.targetScore}`,
    user.latestScore && `Latest full mock test score: ${user.latestScore}`,
    user.examDate && `Planned exam date: ${user.examDate.toISOString().slice(0, 10)}`,
    user.weakest.length > 0 && `Weakest domains by practice accuracy: ${user.weakest.join(", ")}`,
  ].filter(Boolean);
  return `Context about the student you are helping (use it to personalise advice; don't recite it back):\n${lines.join("\n")}`;
}
