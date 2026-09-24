"use client";

import { useActionState, useMemo, useState } from "react";
import { completeOnboarding } from "./actions";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

type Uni = { id: string; name: string; country: string; satLow: number; satHigh: number };

export function OnboardingForm({
  universities,
  branches,
  groups,
  defaults,
}: {
  universities: Uni[];
  branches: { id: string; name: string }[];
  groups: { id: string; name: string; branchId: string | null; schedule: string | null }[];
  defaults: { targetScore: number; examDate: string; targetUniId: string };
}) {
  const [state, action] = useActionState(completeOnboarding, null);
  const [score, setScore] = useState(defaults.targetScore);
  const [uniId, setUniId] = useState(defaults.targetUniId);
  const [branchId, setBranchId] = useState(branches.length === 1 ? branches[0].id : "");
  const uni = universities.find((u) => u.id === uniId);
  const branchGroups = useMemo(
    () => groups.filter((g) => !branchId || !g.branchId || g.branchId === branchId),
    [groups, branchId],
  );

  return (
    <form action={action} className="mt-8 space-y-6">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">Target SAT score</span>
          <span className="font-display text-3xl font-extrabold text-brand tabular-nums">{score}</span>
        </div>
        <input
          type="range"
          name="targetScore"
          min={1000}
          max={1600}
          step={10}
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="mt-4 w-full accent-[var(--brand)]"
        />
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>1000</span>
          <span>1300</span>
          <span>1600</span>
        </div>
        {uni && (
          <p
            className={cn(
              "mt-3 rounded-xl px-3 py-2 text-sm",
              score >= uni.satHigh ? "bg-success-soft text-success" : score >= uni.satLow ? "bg-warning-soft text-warning" : "bg-danger-soft text-danger",
            )}
          >
            {uni.name} admits students scoring {uni.satLow}–{uni.satHigh} (middle 50%).{" "}
            {score >= uni.satHigh ? "Your goal is above the range — great." : score >= uni.satLow ? "Your goal is inside the range." : "Consider aiming a bit higher."}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dream university">
          <Select name="targetUniId" value={uniId} onChange={(e) => setUniId(e.target.value)}>
            <option value="">Not decided yet</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.country}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Planned exam date" hint="You can change this later">
          <Input type="date" name="examDate" defaultValue={defaults.examDate} />
        </Field>
        {branches.length > 0 && (
          <Field label="Branch">
            <Select name="branchId" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">Choose a branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {groups.length > 0 && (
          <Field label="Your group" hint="Your teacher can also assign you">
            <Select name="groupId" defaultValue="">
              <option value="">I&apos;m not in a group yet</option>
              {branchGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                  {g.schedule ? ` · ${g.schedule}` : ""}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="Phone (optional)">
          <Input name="phone" type="tel" placeholder="+998 90 123 45 67" />
        </Field>
      </div>

      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full sm:w-auto" pendingText="Saving…">
        Start preparing
      </SubmitButton>
    </form>
  );
}
