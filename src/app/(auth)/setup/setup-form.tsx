"use client";

import { useActionState } from "react";
import { setupFirstCenter } from "../actions";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";

export function SetupForm() {
  const [state, action] = useActionState(setupFirstCenter, null);
  const t = useT();
  return (
    <form action={action} className="mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <Field label={t.auth.centerName}>
          <Input name="centerName" required placeholder="BIS School" />
        </Field>
        <Field label={t.auth.city}>
          <Input name="city" placeholder={t.auth.cityPlaceholder} />
        </Field>
      </div>
      <Field label={t.auth.yourName}>
        <Input name="name" required autoComplete="name" placeholder={t.auth.yourNamePlaceholder} />
      </Field>
      <Field label={t.auth.email}>
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.auth.password} hint={t.auth.passwordHint}>
          <Input name="password" type="password" required autoComplete="new-password" minLength={8} />
        </Field>
        <Field label={t.setup.confirm}>
          <Input name="confirm" type="password" required autoComplete="new-password" minLength={8} />
        </Field>
      </div>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText={t.setup.creating}>
        {t.setup.create}
      </SubmitButton>
      <p className="text-center text-sm text-muted">{t.setup.note}</p>
    </form>
  );
}
