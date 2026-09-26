"use client";

import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, type ActionState } from "@/components/action-form";
import { useT } from "@/lib/i18n/client";

type Unit = { title: string; topicId: string | null; summary: string; videoUrl: string | null; notes: string };

export function UnitForm({ action, topics, unit }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; topics: { id: string; name: string }[]; unit?: Unit }) {
  const R = useT().adminRoadmap;
  return (
    <ActionForm action={action} submitLabel={R.saveUnit} className="max-w-3xl">
      <Field label={R.title}><Input name="title" defaultValue={unit?.title} required /></Field>
      <Field label={R.quizTopic} hint={R.quizTopicHint}>
        <Select name="topicId" defaultValue={unit?.topicId ?? ""}>
          <option value="">{R.noQuiz}</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
      <Field label={R.summary}><Input name="summary" defaultValue={unit?.summary} required maxLength={200} /></Field>
      <Field label={R.video} hint={R.videoHint}>
        <Input name="videoUrl" type="url" defaultValue={unit?.videoUrl ?? ""} placeholder="https://www.youtube.com/watch?v=…" />
      </Field>
      <Field label={R.notes} hint={R.notesHint}>
        <Textarea name="notes" defaultValue={unit?.notes} rows={16} className="font-mono text-[13px]" />
      </Field>
    </ActionForm>
  );
}
