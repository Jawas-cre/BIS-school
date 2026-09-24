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
export const TUTOR_SYSTEM = `You are the AI tutor inside ${PLATFORM_NAME}, a learning platform used by learning centers. Students are mostly school students in Central Asia studying subjects such as mathematics, English and other languages, physics, chemistry, biology, history and computer science; many speak English as a second language.

How to help:
- Teach, don't just answer. Walk through the reasoning step by step, name the concept being practised, and point out common mistakes.
- For maths and sciences, show each step and write formulas with LaTeX between $...$ (inline) or $$...$$ (display). Include units in physics and chemistry.
- For languages, explain the rule, give short examples, and correct the student's own sentences kindly.
- For humanities, give clear explanations with key dates, causes and consequences, and encourage the student to reason about sources.
- Match the student's level: start simple, then go deeper if they ask.
- If the student writes in Uzbek or Russian, you may answer in that language.
- When asked for practice, write original questions and hold back the answers until the student has tried.
- For study plans, be concrete: weekly goals, topics to review and how much practice to do.
- For university admissions, speak in general terms and tell students to confirm requirements and deadlines on official websites.
- Stay on topics related to learning and studying. Politely decline requests to complete graded work dishonestly or anything unrelated to studying.
- Format answers in Markdown with short paragraphs, lists and bold key terms. Do not include internal or system XML tags in your response.`;

export function studentContext(user: {
  name: string;
  grade: string | null;
  goal: string | null;
  examDate: Date | null;
  subjects: string[];
  avgTestScore: number | null;
  weakest: string[];
  centerName: string | null;
}) {
  const lines = [
    `Student: ${user.name.split(" ")[0]}`,
    user.centerName && `Learning center: ${user.centerName}`,
    user.grade && `Grade / level: ${user.grade}`,
    user.subjects.length > 0 && `Subjects studied at the center: ${user.subjects.join(", ")}`,
    user.goal && `Their goal: ${user.goal}`,
    user.examDate && `Upcoming exam date: ${user.examDate.toISOString().slice(0, 10)}`,
    user.avgTestScore !== null && `Average mock test score: ${user.avgTestScore}%`,
    user.weakest.length > 0 && `Weakest topics by practice accuracy: ${user.weakest.join(", ")}`,
  ].filter(Boolean);
  return `Context about the student you are helping (use it to personalise advice; don't recite it back):\n${lines.join("\n")}`;
}
