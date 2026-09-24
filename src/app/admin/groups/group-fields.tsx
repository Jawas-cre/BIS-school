import { Field, Input, Select } from "@/components/ui/form";

export function GroupFields({
  branches,
  teachers,
  subjects,
  defaults,
}: {
  branches: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
  defaults?: { name: string; subjectId: string | null; branchId: string | null; teacherId: string | null; schedule: string | null };
}) {
  return (
    <>
      <Field label="Group name"><Input name="name" defaultValue={defaults?.name} placeholder="Mathematics · Grade 9 A" required /></Field>
      <Field label="Subject">
        <Select name="subjectId" defaultValue={defaults?.subjectId ?? ""}>
          <option value="">—</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      <Field label="Branch">
        <Select name="branchId" defaultValue={defaults?.branchId ?? ""}>
          <option value="">—</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </Field>
      <Field label="Teacher">
        <Select name="teacherId" defaultValue={defaults?.teacherId ?? ""}>
          <option value="">Not assigned</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
      <Field label="Schedule"><Input name="schedule" defaultValue={defaults?.schedule ?? ""} placeholder="Mon / Wed / Fri · 16:00" /></Field>
    </>
  );
}
