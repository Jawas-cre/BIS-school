"use client";

import { useActionState, useState } from "react";
import { completeOnboarding } from "./actions";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

type Group = { id: string; name: string; branchId: string | null; schedule: string | null; subject: { name: string; color: string } | null };

export function OnboardingForm({
  universities,
  branches,
  groups,
  joined,
}: {
  universities: { id: string; name: string; country: string }[];
  branches: { id: string; name: string }[];
  groups: Group[];
  /** Groups the student already joined, e.g. through their invite code. */
  joined: string[];
}) {
  const [state, action] = useActionState(completeOnboarding, null);
  const t = useT();
  const f = t.fields;
  const [branchId, setBranchId] = useState(branches.length === 1 ? branches[0].id : "");
  const [picked, setPicked] = useState<string[]>(joined);
  const visible = groups.filter((g) => !branchId || !g.branchId || g.branchId === branchId);
  const countries = [...new Set(universities.map((u) => u.country))];

  return (
    <form action={action} className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={f.grade}>
          <Input name="grade" placeholder={f.gradePlaceholder} />
        </Field>
        <Field label={f.phoneOptional}>
          <Input name="phone" type="tel" placeholder="+998 90 123 45 67" />
        </Field>
        <Field label={f.goal} hint={f.goalHint} className="sm:col-span-2">
          <Input name="goal" placeholder={f.goalPlaceholder} maxLength={160} />
        </Field>
        <Field label={f.examDate} hint={f.examDateHint}>
          <Input type="date" name="examDate" />
        </Field>
        <Field label={f.dreamUni}>
          <Select name="targetUniId" defaultValue="">
            <option value="">{f.notDecided}</option>
            {countries.map((c) => (
              <optgroup key={c} label={c}>
                {universities.filter((u) => u.country === c).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </optgroup>
            ))}
          </Select>
        </Field>
        {branches.length > 0 && (
          <Field label={f.branch}>
            <Select name="branchId" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">{f.chooseBranch}</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
        )}
      </div>

      {groups.length > 0 && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">{f.yourGroups}</legend>
          <p className="mb-3 text-xs text-muted">{f.yourGroupsHint}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {visible.map((g) => {
              const on = picked.includes(g.id);
              return (
                <label key={g.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border bg-surface p-3 transition-colors", on ? "border-brand ring-4 ring-brand-soft" : "border-line hover:border-line-strong")}>
                  <input
                    type="checkbox"
                    name="groupIds"
                    value={g.id}
                    checked={on}
                    onChange={() => setPicked((p) => (on ? p.filter((x) => x !== g.id) : [...p, g.id]))}
                    className="mt-1 size-4 accent-[var(--brand)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{g.name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      {g.subject && <span className="size-1.5 rounded-full" style={{ background: g.subject.color }} />}
                      {[g.subject?.name, g.schedule].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full sm:w-auto" >
        {t.onboarding.start}
      </SubmitButton>
    </form>
  );
}
