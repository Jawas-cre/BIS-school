"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import type { Group, ScriptLine } from "@/lib/mock/format";
import { cn } from "@/lib/utils";
import { QuestionGroups } from "./exam/questions";

type Part = { groups: Group[]; from: number; to: number; script?: ScriptLine[] | null; title?: string };

// Reviewing a finished section: every answer next to the correct one, part by part, with the
// listening transcript when the computer read the recording.
const STYLE = {
  "--ex-bg": "var(--surface)",
  "--ex-fg": "var(--ink)",
  "--ex-muted": "var(--muted)",
  "--ex-line": "var(--line)",
  "--ex-line-strong": "var(--line-strong)",
  "--ex-accent": "var(--brand)",
  "--ex-accent-soft": "var(--brand-soft)",
  "--ex-hover": "var(--surface-2)",
} as CSSProperties;

export function ReviewQuestions({
  parts,
  answers,
  correct,
  keyText,
  labels,
}: {
  parts: Part[];
  answers: Record<string, string>;
  correct: Record<number, boolean>;
  keyText: Record<number, string>;
  labels: { part: string; transcript: string };
}) {
  const [part, setPart] = useState(0);
  const p = parts[part];
  return (
    <div style={STYLE}>
      <div className="mb-4 flex flex-wrap gap-1">
        {parts.map((x, i) => (
          <button
            key={i}
            onClick={() => setPart(i)}
            className={cn("rounded-xl px-3 py-1.5 text-sm font-semibold", i === part ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2")}
          >
            {labels.part} {i + 1}
            <span className="ml-1.5 text-xs text-muted tabular-nums">
              {Object.entries(correct).filter(([n, ok]) => ok && Number(n) >= x.from && Number(n) <= x.to).length}/{Math.max(0, x.to - x.from + 1)}
            </span>
          </button>
        ))}
      </div>
      {p.title && <h3 className="mb-3 font-display text-lg font-bold">{p.title}</h3>}
      <QuestionGroups
        groups={p.groups}
        props={{ answers, setAnswer: () => {}, flags: new Set(), toggleFlag: () => {}, focus: () => {}, current: null, review: { correct, key: keyText } }}
      />
      {p.script && p.script.length > 0 && (
        <details className="mt-6 rounded-xl border border-line p-4">
          <summary className="cursor-pointer font-semibold">{labels.transcript}</summary>
          <div className="mt-3 space-y-1.5 text-sm">
            {p.script.map((line, i) =>
              "pause" in line ? null : (
                <p key={i}>
                  <b>{line.speaker}:</b> {line.text}
                </p>
              ),
            )}
          </div>
        </details>
      )}
    </div>
  );
}
