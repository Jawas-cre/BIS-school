"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, Bookmark, Sparkles } from "lucide-react";
import { checkAnswer, toggleBookmark, type CheckResult } from "../actions";
import { Choices, GridIn } from "@/components/question/choices";
import { Markdown } from "@/components/markdown";
import { Button, ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Practice({
  questionId,
  type,
  choices,
  saved: initialSaved,
  nextHref,
  askText,
}: {
  questionId: string;
  type: string;
  choices: string[];
  saved: boolean;
  nextHref: string | null;
  askText: string;
}) {
  const [value, setValue] = useState("");
  const [struck, setStruck] = useState<string[]>([]);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [saved, setSaved] = useState(initialSaved);
  const [pending, start] = useTransition();
  const [startedAt] = useState(() => Date.now());

  function submit() {
    if (!value) return;
    const seconds = (Date.now() - startedAt) / 1000;
    start(async () => setResult(await checkAnswer(questionId, value, seconds)));
  }

  return (
    <div>
      {type === "MCQ" ? (
        <Choices
          choices={choices}
          value={value}
          onChange={setValue}
          result={result}
          struck={struck}
          onStrike={(l) => setStruck((s) => (s.includes(l) ? s.filter((x) => x !== l) : [...s, l]))}
        />
      ) : (
        <GridIn value={value} onChange={setValue} result={result} />
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {!result ? (
          <Button onClick={submit} disabled={!value || pending} size="lg">
            {pending ? "Checking…" : "Check answer"}
          </Button>
        ) : nextHref ? (
          <ButtonLink href={nextHref} size="lg">
            Next question <ArrowRight className="size-4" />
          </ButtonLink>
        ) : (
          <ButtonLink href="/questions" size="lg" variant="secondary">
            Back to bank
          </ButtonLink>
        )}
        <Button
          variant="ghost"
          onClick={() => start(async () => setSaved(await toggleBookmark(questionId)))}
          aria-pressed={saved}
        >
          <Bookmark className={cn("size-4", saved && "fill-brand text-brand")} />
          {saved ? "Saved" : "Save"}
        </Button>
      </div>

      {result && (
        <div
          className={cn(
            "mt-6 animate-fade-up rounded-2xl border p-5",
            result.correct ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft",
          )}
        >
          <div className={cn("font-display text-lg font-extrabold", result.correct ? "text-success" : "text-danger")}>
            {result.correct ? "Correct!" : `Not quite — the answer is ${result.answer}`}
          </div>
          <div className="mt-3 rounded-xl bg-surface p-4">
            <div className="mb-1 text-xs font-bold tracking-wider text-muted uppercase">Explanation</div>
            <Markdown className="text-[15px]">{result.explanation}</Markdown>
          </div>
          <Link
            href={`/assistant?q=${encodeURIComponent(askText.slice(0, 1500))}`}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
          >
            <Sparkles className="size-4" /> Still confused? Ask the AI Assistant
          </Link>
        </div>
      )}
    </div>
  );
}
