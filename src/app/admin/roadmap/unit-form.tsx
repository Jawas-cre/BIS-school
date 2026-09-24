import { ALL_SKILLS } from "@/lib/sat";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, type ActionState } from "@/components/action-form";

type Unit = { title: string; section: string; skill: string | null; summary: string; videoUrl: string | null; notes: string };

export function UnitForm({ action, unit }: { action: (s: ActionState, fd: FormData) => Promise<ActionState>; unit?: Unit }) {
  return (
    <ActionForm action={action} submitLabel="Save unit" className="max-w-3xl">
      <Field label="Title"><Input name="title" defaultValue={unit?.title} required /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Section">
          <Select name="section" defaultValue={unit?.section ?? "MATH"}>
            <option value="RW">Reading & Writing</option>
            <option value="MATH">Math</option>
          </Select>
        </Field>
        <Field label="Quiz skill" hint="Students must pass a 5-question quiz on this skill">
          <Select name="skill" defaultValue={unit?.skill ?? ""}>
            <option value="">No quiz (mark as complete)</option>
            {ALL_SKILLS.map((s) => <option key={s.skill} value={s.skill}>{s.section === "RW" ? "R&W" : "Math"} · {s.skill}</option>)}
          </Select>
        </Field>
      </div>
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
