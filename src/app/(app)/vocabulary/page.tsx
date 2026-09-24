import type { Metadata } from "next";
import Link from "next/link";
import { Languages } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { EmptyState, PageHeader, Progress } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { pct } from "@/lib/utils";
import { SubjectBadge } from "@/components/subject-icon";

export const metadata: Metadata = { title: "Vocabulary" };

export default async function VocabularyPage() {
  const user = await requireStudentArea();
  const [decks, progress] = await Promise.all([
    db.vocabDeck.findMany({ where: visibleTo(user.centerId), include: { words: { select: { id: true } }, subject: { select: { name: true, color: true } } }, orderBy: { title: "asc" } }),
    db.userWord.findMany({ where: { userId: user.id }, select: { wordId: true, box: true, nextReview: true } }),
  ]);
  const byWord = new Map(progress.map((p) => [p.wordId, p]));
  // eslint-disable-next-line react-hooks/purity -- server component, evaluated once per request
  const now = Date.now();
  const totalWords = decks.reduce((s, d) => s + d.words.length, 0);
  const mastered = progress.filter((p) => p.box >= 4).length;
  const due = progress.filter((p) => p.nextReview.getTime() <= now && p.box < 5).length;

  return (
    <div>
      <PageHeader
        title="Vocabulary"
        subtitle="Learn words and key terms with spaced-repetition flashcards. Cards you know come back less often; cards you miss come back tomorrow."
      />
      <div className="mb-6 grid grid-cols-3 gap-3 sm:max-w-xl">
        {[
          ["Words", totalWords],
          ["Mastered", mastered],
          ["Due for review", due],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-3.5 shadow-card">
            <div className="text-xs font-semibold text-muted">{label}</div>
            <div className="font-display text-xl font-extrabold">{value}</div>
          </div>
        ))}
      </div>
      {decks.length === 0 ? (
        <EmptyState icon={<Languages className="size-5" />} title="No decks yet">
          Your center hasn&apos;t published vocabulary decks yet.
        </EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {decks.map((d) => {
            const states = d.words.map((w) => byWord.get(w.id));
            const learned = states.filter((s) => s && s.box >= 4).length;
            const learning = states.filter((s) => s && s.box > 0 && s.box < 4).length;
            const dueHere = states.filter((s) => s && s.nextReview.getTime() <= now && s.box < 5).length;
            const fresh = states.filter((s) => !s).length;
            return (
              <Link key={d.id} href={`/vocabulary/${d.id}`} className="group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card hover:border-line-strong">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Badge tone={d.level === "Beginner" ? "success" : d.level === "Intermediate" ? "brand" : "warning"}>{d.level}</Badge>
                    {d.subject && <SubjectBadge name={d.subject.name} color={d.subject.color} />}
                  </span>
                  {dueHere > 0 && <Badge tone="danger">{dueHere} due</Badge>}
                </div>
                <h3 className="mt-3 font-display text-lg font-bold group-hover:text-brand">{d.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted">{d.description}</p>
                <div className="mt-4">
                  <div className="mb-1.5 flex justify-between text-xs text-muted">
                    <span>
                      {learned} mastered · {learning} learning · {fresh} new
                    </span>
                    <span className="font-semibold text-ink">{pct(learned, d.words.length)}%</span>
                  </div>
                  <Progress value={pct(learned, d.words.length)} tone="success" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
