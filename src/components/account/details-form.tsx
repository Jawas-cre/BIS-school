"use client";

import { ActionForm } from "@/components/action-form";
import { Field, Input } from "@/components/ui/form";
import { useT } from "@/lib/i18n/client";
import { updateAccount } from "./actions";

export function DetailsForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const t = useT();
  return (
    <ActionForm action={updateAccount} submitLabel={t.common.saveChanges}>
      <Field label={t.auth.fullName}>
        <Input name="name" defaultValue={name} required autoComplete="name" />
      </Field>
      <Field label={t.auth.email}>
        <Input name="email" type="email" defaultValue={email} required autoComplete="email" />
      </Field>
      <Field label={t.fields.phone}>
        <Input name="phone" type="tel" defaultValue={phone} autoComplete="tel" />
      </Field>
    </ActionForm>
  );
}
