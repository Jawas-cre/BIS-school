"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };
type Kind = "TEST" | "UNIT" | "PRACTICE";

/** What to assign: the kind first, then only that kind's choice. */
export function AssignmentFields({ tests, units, topics, today, defaultDue }: { tests: Option[]; units: Option[]; topics: Option[]; today: string; defaultDue: string }) {
  const t = useT();
  const A = t.assignments;
  const [kind, setKind] = useState<Kind>(tests.length ? "TEST" : units.length ? "UNIT" : "PRACTICE");
  const kinds: { value: Kind; label: string; available: boolean }[] = [
    { value: "TEST", label: A.kind.TEST, available: tests.length > 0 },
    { value: "UNIT", label: A.kind.UNIT, available: units.length > 0 },
    { value: "PRACTICE", label: A.kind.PRACTICE, available: topics.length > 0 },
  ];
  return (
    <div className="space-y-3">
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">{A.what}</legend>
        {kinds
          .filter((k) => k.available)
          .map((k) => (
            <label
              key={k.value}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold",
                kind === k.value ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-2 hover:border-line-strong",
              )}
            >
              <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
              {k.label}
            </label>
          ))}
      </fieldset>
      {kind === "TEST" && (
        <Field label={A.test}>
          <Select name="testId" required defaultValue="">
            <option value="" disabled>{A.choose}</option>
            {tests.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        </Field>
      )}
      {kind === "UNIT" && (
        <Field label={A.unit}>
          <Select name="unitId" required defaultValue="">
            <option value="" disabled>{A.choose}</option>
            {units.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        </Field>
      )}
      {kind === "PRACTICE" && (
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <Field label={A.topic}>
            <Select name="topicId" required defaultValue="">
              <option value="" disabled>{A.choose}</option>
              {topics.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </Field>
          <Field label={A.questions}>
            <Input name="questions" type="number" min={1} max={100} defaultValue={10} />
          </Field>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={A.dueOn}>
          <Input name="dueOn" type="date" required defaultValue={defaultDue} min={today} />
        </Field>
        <Field label={A.titleOptional}>
          <Input name="title" placeholder={A.titlePlaceholder} />
        </Field>
      </div>
      <Field label={A.note}>
        <Input name="note" placeholder={A.notePlaceholder} />
      </Field>
    </div>
  );
}
