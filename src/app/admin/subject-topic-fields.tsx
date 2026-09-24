"use client";

import { useState } from "react";
import { Field, Select } from "@/components/ui/form";
import { useT } from "@/lib/i18n/client";

type SubjectOption = { id: string; name: string; topics: { id: string; name: string }[] };

/** Subject select with a dependent topic select (topic optional). */
export function SubjectTopicFields({ subjects, topicLabel, topicOptional = true, defaultSubjectId, defaultTopicId }: {
  subjects: SubjectOption[];
  topicLabel?: string;
  topicOptional?: boolean;
  defaultSubjectId?: string;
  defaultTopicId?: string | null;
}) {
  const [subjectId, setSubjectId] = useState(defaultSubjectId ?? subjects[0]?.id ?? "");
  const t = useT();
  const topics = subjects.find((s) => s.id === subjectId)?.topics ?? [];
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label={t.adminSubjects.subject}>
        <Select name="subjectId" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      <Field label={topicLabel ?? t.adminSubjects.topic}>
        <Select key={subjectId} name="topicId" defaultValue={subjectId === defaultSubjectId ? (defaultTopicId ?? "") : ""}>
          {topicOptional && <option value="">{t.bank.allTopics}</option>}
          {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </Field>
    </div>
  );
}
