"use client";

import { Check, X } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

const LETTERS = ["A", "B", "C", "D"];

/**
 * Answer options. `result` switches to review mode: the key is green, a wrong pick red.
 * Right-click (or the ⊘ button) strikes out a choice, like the eliminator in Bluebook.
 */
export function Choices({
  choices,
  value,
  onChange,
  result,
  struck = [],
  onStrike,
  disabled,
}: {
  choices: string[];
  value: string;
  onChange: (letter: string) => void;
  result?: { answer: string } | null;
  struck?: string[];
  onStrike?: (letter: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2.5" role="radiogroup">
      {choices.map((choice, i) => {
        const letter = LETTERS[i];
        const selected = value === letter;
        const isKey = result && result.answer === letter;
        const isWrongPick = result && selected && !isKey;
        const isStruck = struck.includes(letter) && !result;
        return (
          <div key={letter} className="flex items-center gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled || Boolean(result)}
              onClick={() => onChange(letter)}
              onContextMenu={(e) => {
                if (!onStrike || result) return;
                e.preventDefault();
                onStrike(letter);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border-2 bg-surface px-3.5 py-3 text-left transition-colors",
                !result && !selected && "border-line hover:border-line-strong hover:bg-surface-2",
                !result && selected && "border-brand bg-brand-soft",
                isKey && "border-success bg-success-soft",
                isWrongPick && "border-danger bg-danger-soft",
                result && !isKey && !isWrongPick && "border-line opacity-70",
                isStruck && "opacity-45",
              )}
            >
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                  !result && selected ? "border-brand bg-brand text-white" : "border-line-strong text-ink-2",
                  isKey && "border-success bg-success text-white",
                  isWrongPick && "border-danger bg-danger text-white",
                )}
              >
                {isKey ? <Check className="size-4" /> : isWrongPick ? <X className="size-4" /> : letter}
              </span>
              <Markdown className={cn("min-w-0 flex-1 text-[15px] text-ink [&_p]:m-0", isStruck && "line-through")}>{choice}</Markdown>
            </button>
            {onStrike && !result && (
              <button
                type="button"
                onClick={() => onStrike(letter)}
                aria-label={`${isStruck ? "Restore" : "Eliminate"} choice ${letter}`}
                title={isStruck ? "Restore" : "Eliminate"}
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-bold transition-colors",
                  isStruck ? "border-ink-2 bg-ink-2 text-surface" : "border-line-strong text-muted hover:text-ink",
                )}
              >
                <span className={cn(!isStruck && "line-through")}>{letter}</span>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GridIn({
  value,
  onChange,
  disabled,
  result,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  result?: { correct: boolean; answer: string } | null;
}) {
  return (
    <div className="max-w-xs">
      <label className="mb-1.5 block text-sm font-semibold text-ink">Your answer</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9./-]/g, "").slice(0, 7))}
        disabled={disabled || Boolean(result)}
        inputMode="decimal"
        placeholder="e.g. 3/4 or 0.75"
        className={cn(
          "h-12 w-full rounded-xl border-2 bg-surface px-4 font-mono text-lg tracking-wider text-ink outline-none focus:border-brand",
          result ? (result.correct ? "border-success" : "border-danger") : "border-line-strong",
        )}
      />
      <p className="mt-1.5 text-xs text-muted">
        {result && !result.correct ? (
          <>
            Correct answer: <strong className="text-ink">{result.answer}</strong>
          </>
        ) : (
          "Enter a number, fraction (3/4) or decimal. Negative answers are allowed."
        )}
      </p>
    </div>
  );
}
