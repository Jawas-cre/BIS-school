"use client";

import { useActionState } from "react";
import { changePassword, updateProfile } from "./actions";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function ProfileForm({
  universities,
  defaults,
}: {
  universities: { id: string; name: string }[];
  defaults: { name: string; phone: string; grade: string; goal: string; examDate: string; targetUniId: string };
}) {
  const [state, action] = useActionState(updateProfile, null);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <Input name="name" defaultValue={defaults.name} required />
        </Field>
        <Field label="Phone">
          <Input name="phone" defaultValue={defaults.phone} type="tel" />
        </Field>
        <Field label="Grade or level">
          <Input name="grade" defaultValue={defaults.grade} />
        </Field>
        <Field label="Next important exam">
          <Input name="examDate" type="date" defaultValue={defaults.examDate} />
        </Field>
      </div>
      <Field label="Your goal">
        <Input name="goal" defaultValue={defaults.goal} maxLength={160} />
      </Field>
      <Field label="Dream university">
        <Select name="targetUniId" defaultValue={defaults.targetUniId}>
          <option value="">Not decided yet</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      </Field>
      <FormMessage state={state} />
      <SubmitButton>Save changes</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  return (
    <form action={action} className="space-y-4">
      <Field label="Current password">
        <Input name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="New password" hint="At least 8 characters">
        <Input name="next" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="outline">Update password</SubmitButton>
    </form>
  );
}
