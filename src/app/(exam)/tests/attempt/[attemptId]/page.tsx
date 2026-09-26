import { notFound, redirect } from "next/navigation";
import { requireStudentArea } from "@/lib/auth";
import { loadAttempt, parseJson, secondsLeft } from "@/lib/tests";
import { parseChoices } from "@/lib/quiz";
import { expireIfNeeded } from "@/app/(app)/tests/actions";
import { Runner } from "./runner";
import { pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.exam.inProgressTitle);

export default async function AttemptPage({ params }: PageProps<"/tests/attempt/[attemptId]">) {
  const user = await requireStudentArea();
  const { attemptId } = await params;
  await expireIfNeeded(attemptId).catch(() => null);
  const attempt = await loadAttempt(attemptId, user.id);
  if (!attempt) notFound();
  if (attempt.status === "COMPLETED") redirect(`/tests/attempt/${attempt.id}/results`);

  const mods = attempt.test.modules;
  const mod = mods[attempt.moduleIndex];
  const answers = parseJson<Record<string, string>>(attempt.answers, {});
  const flagged = parseJson<string[]>(attempt.flagged, []);
  const ids = new Set(mod.questions.map((q) => q.questionId));

  return (
    <Runner
      key={`${attempt.id}:${attempt.moduleIndex}`}
      attemptId={attempt.id}
      studentName={user.name}
      testTitle={attempt.test.title}
      module={{ index: attempt.moduleIndex, count: mods.length, title: mod.title, seconds: secondsLeft(attempt), isLast: attempt.moduleIndex === mods.length - 1 }}
      questions={mod.questions.map(({ question: q }) => ({ id: q.id, type: q.type, passage: q.passage, stem: q.stem, choices: parseChoices(q.choices) }))}
      initialAnswers={Object.fromEntries(Object.entries(answers).filter(([id]) => ids.has(id)))}
      initialFlagged={flagged.filter((id) => ids.has(id))}
    />
  );
}
