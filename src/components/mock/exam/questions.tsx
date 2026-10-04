"use client";

import { Flag } from "lucide-react";
import type { Block, Group, Question, Segment } from "@/lib/mock/format";
import { cn } from "@/lib/utils";

// The questions of one Listening part or Reading passage, drawn like the computer-delivered IELTS:
// answer boxes inside the text show their question number until something is typed.

export type AnswerProps = {
  answers: Record<string, string>;
  setAnswer: (n: number, value: string) => void;
  flags: Set<number>;
  toggleFlag: (n: number) => void;
  focus: (n: number) => void;
  current: number | null;
  /** Review mode: answers can't be changed and each number shows right or wrong. */
  review?: { correct: Record<number, boolean>; key: Record<number, string> };
};

/** **bold** in teachers' text. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

function GapInput({ n, props }: { n: number; props: AnswerProps }) {
  const value = props.answers[n] ?? "";
  const verdict = props.review ? props.review.correct[n] : undefined;
  return (
    <span className="inline-flex items-center align-baseline" id={`q-${n}`}>
      {props.review && <span className="ml-1 text-[0.8em] font-bold text-[var(--ex-muted)]">{n}</span>}
      <input
        aria-label={`Question ${n}`}
        value={value}
        readOnly={!!props.review}
        onChange={(e) => props.setAnswer(n, e.target.value)}
        onFocus={() => props.focus(n)}
        placeholder={props.review ? "—" : String(n)}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "mx-1 h-[1.9em] w-[9.5em] rounded-[3px] border bg-[var(--ex-bg)] px-1.5 text-center font-semibold text-[var(--ex-fg)] outline-none placeholder:font-bold placeholder:text-[var(--ex-fg)]",
          props.current === n ? "border-[var(--ex-accent)] ring-2 ring-[var(--ex-accent)]/30" : "border-[var(--ex-line-strong)]",
          verdict === true && "border-emerald-600 bg-emerald-50 text-emerald-900",
          verdict === false && "border-red-600 bg-red-50 text-red-900",
        )}
      />
      {props.review && verdict === false && <span className="text-[0.8em] font-semibold text-emerald-700">({props.review.key[n]})</span>}
    </span>
  );
}

function Segments({ segments, props }: { segments: Segment[]; props: AnswerProps }) {
  return (
    <>
      {segments.map((s, i) => (typeof s === "string" ? <RichText key={i} text={s} /> : <GapInput key={i} n={s.gap} props={props} />))}
    </>
  );
}

function Number_({ n, label, props }: { n: number; label?: string; props: AnswerProps }) {
  const flagged = props.flags.has(n);
  const verdict = props.review?.correct[n];
  return (
    <span className="mr-2 inline-flex shrink-0 items-center gap-1">
      <span
        className={cn(
          "grid h-[1.7em] min-w-[1.7em] place-items-center rounded-[3px] border px-1 text-[0.9em] font-bold",
          verdict === true ? "border-emerald-600 bg-emerald-600 text-white" : verdict === false ? "border-red-600 bg-red-600 text-white" : "border-[var(--ex-fg)]",
        )}
      >
        {label ?? n}
      </span>
      {!props.review && (
        <button
          type="button"
          onClick={() => props.toggleFlag(n)}
          aria-pressed={flagged}
          aria-label={flagged ? `Remove review mark from question ${n}` : `Mark question ${n} for review`}
          title="Review"
          className={cn("grid size-[1.6em] place-items-center rounded", flagged ? "text-[var(--ex-accent)]" : "text-[var(--ex-muted)] opacity-50 hover:opacity-100")}
        >
          <Flag className="size-[0.85em]" fill={flagged ? "currentColor" : "none"} />
        </button>
      )}
    </span>
  );
}

function Option({ checked, type, name, label, text, onChange, disabled, mark }: { checked: boolean; type: "radio" | "checkbox"; name: string; label: string; text: string; onChange: () => void; disabled?: boolean; mark?: "right" | "wrong" }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-[3px] border px-3 py-2",
        checked ? "border-[var(--ex-accent)] bg-[var(--ex-accent-soft)]" : "border-transparent hover:bg-[var(--ex-hover)]",
        mark === "right" && "border-emerald-600 bg-emerald-50 text-emerald-900",
        mark === "wrong" && "border-red-600 bg-red-50 text-red-900",
        disabled && !checked && "cursor-not-allowed opacity-60",
      )}
    >
      <input type={type} name={name} checked={checked} onChange={onChange} disabled={disabled} className="mt-[0.3em] size-[1em] accent-[var(--ex-accent)]" />
      <span className="font-bold">{label}</span>
      <span className="min-w-0">
        <RichText text={text} />
      </span>
    </label>
  );
}

function QuestionView({ q, group, props }: { q: Question; group: Group; props: AnswerProps }) {
  const readOnly = !!props.review;
  if (q.kind === "multi") {
    const first = q.ns[0];
    const chosen = (props.answers[first] ?? "").split(",").filter(Boolean);
    const toggle = (key: string) => {
      if (readOnly) return;
      const next = chosen.includes(key) ? chosen.filter((c) => c !== key) : [...chosen, key].slice(0, q.ns.length);
      props.setAnswer(first, next.sort().join(","));
      props.focus(first);
    };
    const correctKeys = props.review?.key[first]?.split(", ") ?? [];
    return (
      <div id={`q-${first}`} className="space-y-2">
        <p className="flex items-start">
          <Number_ n={first} label={`${q.ns[0]}–${q.ns.at(-1)}`} props={props} />
          <span className="pt-[0.15em]">
            <RichText text={q.prompt} />
          </span>
        </p>
        <div className="space-y-1 pl-1">
          {q.options.map((o) => (
            <Option
              key={o.key}
              type="checkbox"
              name={`q${first}`}
              label={o.key}
              text={o.text}
              checked={chosen.includes(o.key)}
              disabled={readOnly || (!chosen.includes(o.key) && chosen.length >= q.ns.length)}
              onChange={() => toggle(o.key)}
              mark={props.review ? (correctKeys.includes(o.key) ? "right" : chosen.includes(o.key) ? "wrong" : undefined) : undefined}
            />
          ))}
        </div>
      </div>
    );
  }
  const n = q.n;
  const value = props.answers[n] ?? "";
  const set = (v: string) => {
    if (readOnly) return;
    props.setAnswer(n, v);
    props.focus(n);
  };
  const mark = (key: string) => (props.review ? (props.review.key[n] === key ? "right" : value === key ? "wrong" : undefined) : undefined);
  if (q.kind === "choice" || q.kind === "judge") {
    const options = q.kind === "choice" ? q.options : (q.scale === "YNNG" ? ["YES", "NO", "NOT GIVEN"] : ["TRUE", "FALSE", "NOT GIVEN"]).map((k) => ({ key: k, text: "" }));
    return (
      <div id={`q-${n}`} className="space-y-2">
        <p className="flex items-start">
          <Number_ n={n} props={props} />
          <span className="pt-[0.15em]">
            <RichText text={q.prompt} />
          </span>
        </p>
        <div className={cn("pl-1", q.kind === "judge" ? "flex flex-wrap gap-1" : "space-y-1")}>
          {options.map((o) => (
            <Option key={o.key} type="radio" name={`q${n}`} label={o.key} text={o.text} checked={value === o.key} onChange={() => set(o.key)} disabled={readOnly && value !== o.key} mark={mark(o.key)} />
          ))}
        </div>
      </div>
    );
  }
  // Matching: pick a letter (or numeral) from the group's list.
  return (
    <div id={`q-${n}`} className="flex flex-wrap items-center gap-2">
      <Number_ n={n} props={props} />
      <span className="min-w-0 flex-1">
        <RichText text={q.prompt} />
      </span>
      <select
        aria-label={`Question ${n}`}
        value={value}
        disabled={readOnly}
        onChange={(e) => set(e.target.value)}
        onFocus={() => props.focus(n)}
        className={cn(
          "h-[2em] min-w-[5em] rounded-[3px] border border-[var(--ex-line-strong)] bg-[var(--ex-bg)] px-2 font-semibold text-[var(--ex-fg)]",
          props.current === n && "border-[var(--ex-accent)] ring-2 ring-[var(--ex-accent)]/30",
          props.review && (props.review.correct[n] ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-red-600 bg-red-50 text-red-900"),
        )}
      >
        <option value="">{props.review ? "—" : ""}</option>
        {group.options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.key}
          </option>
        ))}
      </select>
      {props.review && !props.review.correct[n] && <span className="text-[0.85em] font-semibold text-emerald-700">({props.review.key[n]})</span>}
    </div>
  );
}

function BlockView({ block, group, props }: { block: Block; group: Group; props: AnswerProps }) {
  if (block.type === "space") return <div className="h-2" />;
  if (block.type === "question") return <QuestionView q={block.question} group={group} props={props} />;
  if (block.type === "table") {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r} className={cn(r === 0 && "font-bold")}>
                {row.map((cell, c) => (
                  <td key={c} className="border border-[var(--ex-line-strong)] px-2 py-1.5 align-top">
                    <Segments segments={cell} props={props} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (block.style === "heading") return <p className="pt-1 text-center font-bold"><Segments segments={block.segments} props={props} /></p>;
  if (block.style === "bullet") {
    return (
      <p className="flex gap-2 pl-2 leading-[2.1]">
        <span>•</span>
        <span>
          <Segments segments={block.segments} props={props} />
        </span>
      </p>
    );
  }
  return (
    <p className="leading-[2.1]">
      <Segments segments={block.segments} props={props} />
    </p>
  );
}

export function QuestionGroups({ groups, props }: { groups: Group[]; props: AnswerProps }) {
  return (
    <div className="space-y-8">
      {groups.map((g, i) => (
        <section key={i} className="space-y-3">
          <div>
            <h3 className="font-bold">{g.to >= g.from ? (g.to > g.from ? `Questions ${g.from}–${g.to}` : `Question ${g.from}`) : g.heading}</h3>
            {g.heading && g.to >= g.from && <p className="font-semibold">{g.heading}</p>}
            {g.instructions.map((line, j) => (
              <p key={j} className={cn(j === 0 && "mt-1")}>
                {/* Word limits like ONE WORD AND/OR A NUMBER are bold, as in the real test. */}
                <RichText text={line.includes("**") ? line : line.replace(/\b([A-Z]{2,}(?:\s+(?:AND\/OR|OR|AND|A|[A-Z]{2,}))*)\b/g, "**$1**")} />
              </p>
            ))}
          </div>
          {g.options.length > 0 && (
            <div className="max-w-xl rounded-[3px] border border-[var(--ex-line-strong)] p-3">
              {g.options.map((o) => (
                <p key={o.key} className="flex gap-3">
                  <span className="w-8 shrink-0 font-bold">{o.key}</span>
                  <span>
                    <RichText text={o.text} />
                  </span>
                </p>
              ))}
            </div>
          )}
          <div className="space-y-4">
            {g.blocks.map((b, j) => (
              <BlockView key={j} block={b} group={g} props={props} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** Which numbers count as answered, for the navigator. "Choose TWO" counts one per chosen letter. */
export function answeredNumbers(groups: Group[], answers: Record<string, string>) {
  const done = new Set<number>();
  for (const g of groups) {
    for (const b of g.blocks) {
      const visit = (n: number) => answers[n]?.trim() && done.add(n);
      if (b.type === "question") {
        const q = b.question;
        if (q.kind === "multi") {
          const chosen = (answers[q.ns[0]] ?? "").split(",").filter(Boolean).length;
          q.ns.slice(0, chosen).forEach((n) => done.add(n));
        } else visit(q.n);
      } else if (b.type === "text") b.segments.forEach((s) => typeof s !== "string" && visit(s.gap));
      else if (b.type === "table") b.rows.flat(2).forEach((s) => typeof s !== "string" && visit(s.gap));
    }
  }
  return done;
}
