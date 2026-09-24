import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { bankQuery, filtersToQuery, parseFilters } from "@/lib/questions";
import { parseChoices } from "@/lib/quiz";
import { SubjectBadge } from "@/components/subject-icon";
import { DifficultyBadge, Badge } from "@/components/ui/badge";
import { QuestionBody } from "@/components/question/question-body";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Practice } from "./practice";

export const metadata: Metadata = { title: "Practice" };

export default async function QuestionPage({ params, searchParams }: PageProps<"/questions/[id]">) {
  const user = await requireStudentArea();
  const { id } = await params;
  const f = parseFilters(await searchParams);
  const q = await db.question.findFirst({ where: { id, ...visibleTo(user.centerId) }, include: { subject: true, topic: true } });
  if (!q) notFound();

  const [{ rows, results, saved }, history] = await Promise.all([
    bankQuery(user, f),
    db.questionAttempt.findMany({ where: { userId: user.id, questionId: id }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const index = rows.findIndex((r) => r.id === id);
  const prev = index > 0 ? rows[index - 1] : null;
  const next = index >= 0 && index < rows.length - 1 ? rows[index + 1] : null;
  const qs = filtersToQuery(f);
  const last = results.get(id);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
          <Link href={`/questions${qs}`} className="hover:text-ink">
            Question Bank
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href={`/questions${filtersToQuery({ subject: q.subjectId, topic: q.topicId })}`} className="truncate hover:text-ink">
            {q.subject.name} · {q.topic.name}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {index >= 0 && (
            <span className="text-sm text-muted tabular-nums">
              {index + 1} / {rows.length}
            </span>
          )}
          <Link
            href={prev ? `/questions/${prev.id}${qs}` : "#"}
            aria-disabled={!prev}
            className={cn(buttonClass("outline", "sm"), !prev && "pointer-events-none opacity-40")}
          >
            <ChevronLeft className="size-4" /> Prev
          </Link>
          <Link
            href={next ? `/questions/${next.id}${qs}` : "#"}
            aria-disabled={!next}
            className={cn(buttonClass("outline", "sm"), !next && "pointer-events-none opacity-40")}
          >
            Next <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-surface shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          <SubjectBadge name={q.subject.name} color={q.subject.color} />
          <span className="text-sm font-semibold text-ink-2">{q.topic.name}</span>
          <DifficultyBadge difficulty={q.difficulty} />
          {q.type === "SHORT" && <Badge>Typed answer</Badge>}
          {last !== undefined && (
            <Badge tone={last ? "success" : "danger"}>Last try: {last ? "correct" : "incorrect"}</Badge>
          )}
        </div>
        <div className="p-5 sm:p-8">
          <QuestionBody passage={q.passage} stem={q.stem}>
            <Practice
              key={q.id}
              questionId={q.id}
              type={q.type}
              choices={parseChoices(q.choices)}
              saved={saved.has(q.id)}
              nextHref={next ? `/questions/${next.id}${qs}` : null}
              askText={`Can you help me understand this ${q.subject.name} question about ${q.topic.name.toLowerCase()}?\n\n${q.passage ? `${q.passage}\n\n` : ""}${q.stem}${
                parseChoices(q.choices).length ? `\n\n${parseChoices(q.choices).map((c, i) => `${"ABCD"[i]}) ${c}`).join("\n")}` : ""
              }`}
            />
          </QuestionBody>
        </div>
      </div>

      {history.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          You&apos;ve answered this question {history.length === 5 ? "5+" : history.length} time{history.length === 1 ? "" : "s"} ·{" "}
          {history.filter((h) => h.correct).length} correct
        </p>
      )}
    </div>
  );
}
