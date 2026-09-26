"use client";

import { Field, Input, Select } from "@/components/ui/form";
import { useT } from "@/lib/i18n/client";

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
  const G = useT().adminGroups;
  return (
    <>
      <Field label={G.name}><Input name="name" defaultValue={defaults?.name} placeholder={G.namePlaceholder} required /></Field>
      <Field label={G.subject}>
        <Select name="subjectId" defaultValue={defaults?.subjectId ?? ""}>
          <option value="">—</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      <Field label={G.branch}>
        <Select name="branchId" defaultValue={defaults?.branchId ?? ""}>
          <option value="">—</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </Select>
      </Field>
      <Field label={G.teacherLabel}>
        <Select name="teacherId" defaultValue={defaults?.teacherId ?? ""}>
          <option value="">{G.notAssignedOption}</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
      <Field label={G.schedule}><Input name="schedule" defaultValue={defaults?.schedule ?? ""} placeholder={G.schedulePlaceholder} /></Field>
    </>
  );
}
