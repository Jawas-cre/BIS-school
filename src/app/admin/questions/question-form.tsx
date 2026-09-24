"use client";

import { useActionState, useState } from "react";
import { ALL_SKILLS } from "@/lib/sat";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Markdown } from "@/components/markdown";
import type { ActionState } from "@/components/action-form";

type Q = { skill: string; difficulty: string; type: string; passage: string | null; stem: string; choices: string[]; answer: string; explanation: string };

export function QuestionForm({ action, initial }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; initial?: Q }) {
  const [state, formAction] = useActionState(action, null);
  const [type, setType] = useState(initial?.type ?? "MCQ");
  const [stem, setStem] = useState(initial?.stem ?? "");
  const [passage, setPassage] = useState(initial?.passage ?? "");

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Skill" className="sm:col-span-3">
            <Select name="skill" defaultValue={initial?.skill ?? ""} required>
              <option value="" disabled>Choose a skill…</option>
              {(["RW", "MATH"] as const).map((section) => (
                <optgroup key={section} label={section === "RW" ? "Reading & Writing" : "Math"}>
                  {ALL_SKILLS.filter((s) => s.section === section).map((s) => (
                    <option key={s.skill} value={s.skill}>{s.domain} — {s.skill}</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select name="difficulty" defaultValue={initial?.difficulty ?? "MEDIUM"}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </Select>
          </Field>
          <Field label="Answer format" className="sm:col-span-2">
            <Select name="type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="MCQ">Multiple choice (A–D)</option>
              <option value="SPR">Student-produced response (grid-in)</option>
            </Select>
          </Field>
        </div>
        <Field label="Passage (optional)" hint="Markdown supported. Use ______ for a blank.">
          <Textarea name="passage" value={passage} onChange={(e) => setPassage(e.target.value)} rows={4} />
        </Field>
        <Field label="Question" hint="Markdown and $math$ supported, e.g. $x^2 + 3x = 10$">
          <Textarea name="stem" value={stem} onChange={(e) => setStem(e.target.value)} rows={3} required />
        </Field>
        {type === "MCQ" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {["A", "B", "C", "D"].map((l, i) => (
              <Field key={l} label={`Choice ${l}`}>
                <Input name={`choice${l}`} defaultValue={initial?.choices[i] ?? ""} required />
              </Field>
            ))}
          </div>
        )}
        <Field label="Correct answer" hint={type === "MCQ" ? "A, B, C or D" : "Separate multiple accepted answers with |, e.g. 3/4|0.75"}>
          <Input name="answer" defaultValue={initial?.answer ?? ""} required className="max-w-xs" />
        </Field>
        <Field label="Explanation" hint="Shown after students answer">
          <Textarea name="explanation" defaultValue={initial?.explanation ?? ""} rows={4} required />
        </Field>
        <FormMessage state={state} />
        <SubmitButton size="lg">Save question</SubmitButton>
      </div>
      <div className="self-start rounded-2xl border border-line bg-surface p-5 shadow-card xl:sticky xl:top-24">
        <div className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">Preview</div>
        {passage && <Markdown className="passage mb-4">{passage}</Markdown>}
        <Markdown className="text-[15px] font-semibold text-ink">{stem || "_Your question will appear here._"}</Markdown>
      </div>
    </form>
  );
}
