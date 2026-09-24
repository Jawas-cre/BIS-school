"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Markdown } from "@/components/markdown";
import type { ActionState } from "@/components/action-form";

type Q = { subjectId: string; topicId: string; difficulty: string; type: string; passage: string | null; stem: string; choices: string[]; answer: string; explanation: string };
type SubjectOption = { id: string; name: string; topics: { id: string; name: string }[] };

export function QuestionForm({ action, subjects, initial }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; subjects: SubjectOption[]; initial?: Q }) {
  const [state, formAction] = useActionState(action, null);
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? subjects[0]?.id ?? "");
  const [type, setType] = useState(initial?.type ?? "MCQ");
  const [stem, setStem] = useState(initial?.stem ?? "");
  const [passage, setPassage] = useState(initial?.passage ?? "");
  const topics = subjects.find((s) => s.id === subjectId)?.topics ?? [];

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject">
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Topic">
            <Select key={subjectId} name="topicId" defaultValue={initial?.subjectId === subjectId ? initial.topicId : ""} required>
              <option value="" disabled>Choose a topic…</option>
              {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Difficulty">
            <Select name="difficulty" defaultValue={initial?.difficulty ?? "MEDIUM"}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </Select>
          </Field>
          <Field label="Answer format">
            <Select name="type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="MCQ">Multiple choice (A–D)</option>
              <option value="SHORT">Typed answer</option>
            </Select>
          </Field>
        </div>
        <Field label="Passage or context (optional)" hint="Markdown supported. Use ______ for a gap.">
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
        <Field label="Correct answer" hint={type === "MCQ" ? "A, B, C or D" : "Separate several accepted answers with |, e.g. 3/4|0.75 or Tashkent|Toshkent"}>
          <Input name="answer" defaultValue={initial?.answer ?? ""} required className="max-w-md" />
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
