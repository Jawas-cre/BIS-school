"use client";

import { useActionState } from "react";
import { changePassword, updateProfile } from "./actions";
import { Field, FormMessage, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";

export function ProfileForm({
  universities,
  defaults,
}: {
  universities: { id: string; name: string }[];
  defaults: { name: string; phone: string; grade: string; goal: string; examDate: string; targetUniId: string };
}) {
  const [state, action] = useActionState(updateProfile, null);
  const t = useT();
  const f = t.fields;
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.auth.fullName}>
          <Input name="name" defaultValue={defaults.name} required />
        </Field>
        <Field label={f.phone}>
          <Input name="phone" defaultValue={defaults.phone} type="tel" />
        </Field>
        <Field label={f.grade}>
          <Input name="grade" defaultValue={defaults.grade} />
        </Field>
        <Field label={f.examDate}>
          <Input name="examDate" type="date" defaultValue={defaults.examDate} />
        </Field>
      </div>
      <Field label={f.goal}>
        <Input name="goal" defaultValue={defaults.goal} maxLength={160} />
      </Field>
      <Field label={f.dreamUni}>
        <Select name="targetUniId" defaultValue={defaults.targetUniId}>
          <option value="">{f.notDecided}</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>
      </Field>
      <FormMessage state={state} />
      <SubmitButton>{t.common.saveChanges}</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  const t = useT();
  const P = t.profile;
  return (
    <form action={action} className="space-y-4">
      <Field label={P.currentPassword}>
        <Input name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field label={P.newPassword} hint={t.auth.passwordHint}>
        <Input name="next" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      <FormMessage state={state} />
      <SubmitButton variant="outline">{P.updatePassword}</SubmitButton>
    </form>
  );
}
