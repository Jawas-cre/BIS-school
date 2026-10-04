import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireCandidate } from "@/lib/mock/session";
import { publicTest, readAnswers, readContent, readWriting } from "@/lib/mock/tests";
import { ExamRunner } from "@/components/mock/exam/runner";

export const metadata: Metadata = { title: { absolute: "IELTS on computer" } };

/** The server's clock, so the exam screen can correct for a wrong clock on the computer. */
const serverNow = () => Date.now();

export default async function MockExam({ params }: PageProps<"/mock/exam/[id]">) {
  const { id } = await params;
  const candidate = await requireCandidate();
  const attempt = await db.mockAttempt.findUnique({ where: { id }, include: { test: true } });
  if (!attempt || attempt.candidateId !== candidate.id) notFound();
  if (attempt.section === "DONE") redirect(`/mock/result/${id}`);
  return (
    <ExamRunner
      attemptId={attempt.id}
      candidate={{ name: candidate.name, number: candidate.number }}
      title={attempt.test.title}
      test={publicTest(readContent(attempt.test.content))}
      initial={{
        section: attempt.section,
        endsAt: attempt.sectionEndsAt?.getTime() ?? null,
        now: serverNow(),
        answers: readAnswers(attempt.answers),
        writing: readWriting(attempt.writing),
      }}
    />
  );
}
