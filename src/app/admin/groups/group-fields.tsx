import { Field, Input, Select } from "@/components/ui/form";

export function GroupFields({
  branches,
  teachers,
  defaults,
}: {
  branches: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  defaults?: { name: string; branchId: string | null; teacherId: string | null; schedule: string | null };
}) {
  return (
    <>
      <Field label="Group name"><Input name="name" defaultValue={defaults?.name} placeholder="SAT Intensive A1" required /></Field>
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
