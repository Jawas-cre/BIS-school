"use client";

import { useActionState } from "react";
import { registerCenter } from "../../actions";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";

export function CenterForm() {
  const [state, action] = useActionState(registerCenter, null);
  const t = useT();
  return (
    <form action={action} className="mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <Field label={t.auth.centerName}>
          <Input name="centerName" required placeholder="Bright Future Academy" />
        </Field>
        <Field label={t.auth.city}>
          <Input name="city" placeholder={t.auth.cityPlaceholder} />
        </Field>
      </div>
      <Field label={t.auth.yourName}>
        <Input name="name" required autoComplete="name" placeholder={t.auth.yourNamePlaceholder} />
      </Field>
      <Field label={t.auth.workEmail}>
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label={t.auth.password} hint={t.auth.passwordHint}>
        <Input name="password" type="password" required autoComplete="new-password" minLength={8} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText={t.auth.settingUpCenter}>
        {t.auth.createCenter}
      </SubmitButton>
    </form>
  );
}
