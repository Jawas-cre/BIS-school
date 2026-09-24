"use client";

import { useActionState, useState } from "react";
import { completeOnboarding } from "./actions";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

type Group = { id: string; name: string; branchId: string | null; schedule: string | null; subject: { name: string; color: string } | null };

export function OnboardingForm({
  universities,
  branches,
  groups,
}: {
  universities: { id: string; name: string; country: string }[];
  branches: { id: string; name: string }[];
  groups: Group[];
}) {
  const [state, action] = useActionState(completeOnboarding, null);
  const [branchId, setBranchId] = useState(branches.length === 1 ? branches[0].id : "");
  const [picked, setPicked] = useState<string[]>([]);
  const visible = groups.filter((g) => !branchId || !g.branchId || g.branchId === branchId);
  const countries = [...new Set(universities.map((u) => u.country))];

  return (
    <form action={action} className="mt-8 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Grade or level">
          <Input name="grade" placeholder="e.g. Grade 10" />
        </Field>
        <Field label="Phone (optional)">
          <Input name="phone" type="tel" placeholder="+998 90 123 45 67" />
        </Field>
        <Field label="Your goal" hint="What are you working towards?" className="sm:col-span-2">
          <Input name="goal" placeholder="e.g. Enter a medical university, pass my final exams…" maxLength={160} />
        </Field>
        <Field label="Next important exam" hint="Optional — shows a countdown">
          <Input type="date" name="examDate" />
        </Field>
        <Field label="Dream university">
          <Select name="targetUniId" defaultValue="">
            <option value="">Not decided yet</option>
            {countries.map((c) => (
              <optgroup key={c} label={c}>
                {universities.filter((u) => u.country === c).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </optgroup>
            ))}
          </Select>
        </Field>
        {branches.length > 0 && (
          <Field label="Branch">
            <Select name="branchId" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">Choose a branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
        )}
      </div>

      {groups.length > 0 && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">Your groups</legend>
          <p className="mb-3 text-xs text-muted">Pick the classes you attend. Your teacher can also add you.</p>
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
      <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Saving…">
        Start learning
      </SubmitButton>
    </form>
  );
}
