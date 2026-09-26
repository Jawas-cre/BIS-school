"use client";

import { useActionState, useState } from "react";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Markdown } from "@/components/markdown";
import type { ActionState } from "@/components/action-form";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";

type Q = { subjectId: string; topicId: string; difficulty: string; type: string; passage: string | null; stem: string; choices: string[]; answer: string; explanation: string };
type SubjectOption = { id: string; name: string; topics: { id: string; name: string }[] };

export function QuestionForm({ action, subjects, initial }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; subjects: SubjectOption[]; initial?: Q }) {
  const [state, formAction] = useActionState(action, null);
  const [subjectId, setSubjectId] = useState(initial?.subjectId ?? subjects[0]?.id ?? "");
  const [type, setType] = useState(initial?.type ?? "MCQ");
  const [stem, setStem] = useState(initial?.stem ?? "");
  const [passage, setPassage] = useState(initial?.passage ?? "");
  const topics = subjects.find((s) => s.id === subjectId)?.topics ?? [];
  const t = useT();
  const Q = t.adminQuestions;

  return (
    <form action={formAction} className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.adminSubjects.subject}>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label={t.adminSubjects.topic}>
            <Select key={subjectId} name="topicId" defaultValue={initial?.subjectId === subjectId ? initial.topicId : ""} required>
              <option value="" disabled>{Q.chooseTopic}</option>
              {topics.map((topic) => <option key={topic.id} value={topic.id}>{topic.name}</option>)}
            </Select>
          </Field>
          <Field label={t.difficulty.label}>
            <Select name="difficulty" defaultValue={initial?.difficulty ?? "MEDIUM"}>
              <option value="EASY">{t.difficulty.EASY}</option>
              <option value="MEDIUM">{t.difficulty.MEDIUM}</option>
              <option value="HARD">{t.difficulty.HARD}</option>
            </Select>
          </Field>
          <Field label={Q.answerFormat}>
            <Select name="type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="MCQ">{Q.formatMcq}</option>
              <option value="SHORT">{Q.formatShort}</option>
            </Select>
          </Field>
        </div>
        <Field label={Q.passage} hint={Q.passageHint}>
          <Textarea name="passage" value={passage} onChange={(e) => setPassage(e.target.value)} rows={4} />
        </Field>
        <Field label={Q.question} hint={Q.questionHint}>
          <Textarea name="stem" value={stem} onChange={(e) => setStem(e.target.value)} rows={3} required />
        </Field>
        {type === "MCQ" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {["A", "B", "C", "D"].map((l, i) => (
              <Field key={l} label={fmt(Q.choice, { letter: l })}>
                <Input name={`choice${l}`} defaultValue={initial?.choices[i] ?? ""} required />
              </Field>
            ))}
          </div>
        )}
        <Field label={Q.correctAnswer} hint={type === "MCQ" ? Q.answerHintMcq : Q.answerHintShort}>
          <Input name="answer" defaultValue={initial?.answer ?? ""} required className="max-w-md" />
        </Field>
        <Field label={Q.explanation} hint={Q.explanationHint}>
          <Textarea name="explanation" defaultValue={initial?.explanation ?? ""} rows={4} required />
        </Field>
        <FormMessage state={state} />
        <SubmitButton size="lg">{Q.saveQuestion}</SubmitButton>
      </div>
      <div className="self-start rounded-2xl border border-line bg-surface p-5 shadow-card xl:sticky xl:top-24">
        <div className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">{Q.preview}</div>
        {passage && <Markdown className="passage mb-4">{passage}</Markdown>}
        <Markdown className="text-[15px] font-semibold text-ink">{stem || Q.previewEmpty}</Markdown>
      </div>
    </form>
  );
}
