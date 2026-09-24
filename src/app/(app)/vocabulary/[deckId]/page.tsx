import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Flashcards } from "./flashcards";
import { fmt } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.vocab.flashcardsTitle);

export default async function DeckPage({ params }: PageProps<"/vocabulary/[deckId]">) {
  const user = await requireStudentArea();
  const { deckId } = await params;
  const t = await getT();
  const V = t.vocab;
  const deck = await db.vocabDeck.findFirst({ where: { id: deckId, ...visibleTo(user.centerId) }, include: { words: { orderBy: { word: "asc" } } } });
  if (!deck) notFound();
  const progress = await db.userWord.findMany({ where: { userId: user.id, wordId: { in: deck.words.map((w) => w.id) } } });
  const byWord = new Map(progress.map((p) => [p.wordId, p]));
  // eslint-disable-next-line react-hooks/purity -- server component, evaluated once per request
  const now = Date.now();

  // Session: due words first, then new words, up to 20 cards.
  const due = deck.words.filter((w) => {
    const p = byWord.get(w.id);
    return p && p.box < 5 && p.nextReview.getTime() <= now;
  });
  const fresh = deck.words.filter((w) => !byWord.has(w.id));
  const session = [...due, ...fresh].slice(0, 20);

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/vocabulary" className="hover:text-ink">{t.nav.vocabulary}</Link>
        <ChevronRight className="size-3.5" />
        <span>{deck.title}</span>
      </nav>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{deck.title}</h1>
      <p className="mt-1 text-muted">{deck.description}</p>

      <div className="mt-6">
        <Flashcards
          cards={session.map((w) => ({ id: w.id, word: w.word, pos: w.pos, definition: w.definition, example: w.example, synonyms: w.synonyms }))}
          dueCount={due.length}
        />
      </div>

      <h2 className="mt-10 mb-3 font-display text-lg font-bold">{fmt(V.allWords, { n: deck.words.length })}</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <ul className="divide-y divide-line">
          {deck.words.map((w) => {
            const p = byWord.get(w.id);
            const status = !p ? [V.statusNew, "neutral"] : p.box >= 4 ? [V.statusMastered, "success"] : [V.statusLearning, "warning"];
            return (
              <li key={w.id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="w-40 shrink-0">
                  <span className="font-bold">{w.word}</span> <span className="text-xs text-muted italic">{w.pos}</span>
                </div>
                <div className="flex-1 text-sm text-ink-2">{w.definition}</div>
                <Badge tone={status[1] as "neutral" | "success" | "warning"}>{status[0]}</Badge>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
