import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, type ActionState } from "@/components/action-form";

type Unit = { title: string; topicId: string | null; summary: string; videoUrl: string | null; notes: string };

export function UnitForm({ action, topics, unit }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; topics: { id: string; name: string }[]; unit?: Unit }) {
  return (
    <ActionForm action={action} submitLabel="Save unit" className="max-w-3xl">
      <Field label="Title"><Input name="title" defaultValue={unit?.title} required /></Field>
      <Field label="Quiz topic" hint="Students pass a 5-question quiz on this topic to complete the unit">
        <Select name="topicId" defaultValue={unit?.topicId ?? ""}>
          <option value="">No quiz (mark as complete)</option>
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
      <Field label="Summary"><Input name="summary" defaultValue={unit?.summary} required maxLength={200} /></Field>
      <Field label="Video lesson link" hint="YouTube or Vimeo link — shown as an embedded player">
        <Input name="videoUrl" type="url" defaultValue={unit?.videoUrl ?? ""} placeholder="https://www.youtube.com/watch?v=…" />
      </Field>
      <Field label="Lesson notes" hint="Markdown with $math$ supported">
        <Textarea name="notes" defaultValue={unit?.notes} rows={16} className="font-mono text-[13px]" />
      </Field>
    </ActionForm>
  );
}
