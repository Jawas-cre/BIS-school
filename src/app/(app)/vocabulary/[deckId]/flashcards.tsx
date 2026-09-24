"use client";

import { useState, useTransition } from "react";
import { Check, PartyPopper, RotateCcw, X } from "lucide-react";
import { gradeWord } from "../actions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/misc";
import { cn } from "@/lib/utils";

type Card = { id: string; word: string; pos: string; definition: string; example: string; synonyms: string };

export function Flashcards({ cards, dueCount }: { cards: Card[]; dueCount: number }) {
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [known, setKnown] = useState(0);
  const [retried, setRetried] = useState<string[]>([]);
  const [, start] = useTransition();
  const card = queue[0];

  function grade(isKnown: boolean) {
    if (!card) return;
    start(() => gradeWord(card.id, isKnown).then(() => undefined));
    setFlipped(false);
    setDone((d) => d + 1);
    if (isKnown) setKnown((k) => k + 1);
    // A missed card comes back once more at the end of this session.
    const again = !isKnown && !retried.includes(card.id);
    if (again) setRetried((r) => [...r, card.id]);
    setQueue((q) => (again ? [...q.slice(1), card] : q.slice(1)));
  }

  if (!card) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-10 text-center shadow-card">
        <PartyPopper className="mx-auto size-10 text-brand" />
        <h2 className="mt-3 font-display text-2xl font-extrabold">{cards.length ? "Session complete!" : "You're all caught up"}</h2>
        <p className="mt-1 text-muted">
          {cards.length ? `You reviewed ${done} cards and knew ${known}.` : "No words are due in this deck right now. Come back tomorrow for your next review."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-muted">
        <span>
          {dueCount > 0 ? `${dueCount} due · ` : ""}
          {queue.length} left in this session
        </span>
        <span>{done} reviewed</span>
      </div>
      <Progress value={(done / (done + queue.length)) * 100} className="mb-5" />
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="card-flip block w-full text-left"
        aria-label={flipped ? "Show word" : "Show definition"}
      >
        <div className={cn("card-flip-inner relative h-72 sm:h-80", flipped && "flipped")}>
          <div className="card-face absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-line bg-surface p-8 text-center shadow-card">
            <span className="text-sm text-muted italic">{card.pos}</span>
            <span className="mt-2 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{card.word}</span>
            <span className="mt-6 text-sm text-muted">Tap to reveal the meaning</span>
          </div>
          <div className="card-face card-back absolute inset-0 flex flex-col justify-center rounded-3xl border border-brand/30 bg-brand-soft p-8 shadow-card">
            <span className="font-display text-xl font-bold text-brand">{card.word}</span>
            <p className="mt-2 text-lg font-semibold text-ink">{card.definition}</p>
            <p className="mt-3 text-ink-2 italic">“{card.example}”</p>
            {card.synonyms && <p className="mt-3 text-sm text-muted">Synonyms: {card.synonyms}</p>}
          </div>
        </div>
      </button>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" onClick={() => grade(false)}>
          <X className="size-5 text-danger" /> Still learning
        </Button>
        <Button size="lg" onClick={() => grade(true)}>
          <Check className="size-5" /> I know it
        </Button>
      </div>
      <button onClick={() => setFlipped((f) => !f)} className="mx-auto mt-3 flex items-center gap-1 text-sm text-muted hover:text-ink">
        <RotateCcw className="size-3.5" /> Flip card
      </button>
    </div>
  );
}
