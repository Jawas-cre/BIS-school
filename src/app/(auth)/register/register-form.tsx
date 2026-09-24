"use client";

import { useActionState } from "react";
import { registerWithCode } from "../actions";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";

export function RegisterForm({ code }: { code: string }) {
  const [state, action] = useActionState(registerWithCode, null);
  const t = useT();
  return (
    <form action={action} className="mt-8 space-y-4">
      <Field label={t.auth.inviteCode} hint={t.auth.inviteCodeHint}>
        <Input
          name="code"
          required
          defaultValue={code}
          placeholder="K7Q2MX"
          className="font-mono tracking-[0.3em] uppercase"
          maxLength={12}
        />
      </Field>
      <Field label={t.auth.fullName}>
        <Input name="name" required autoComplete="name" placeholder="Aziza Karimova" />
      </Field>
      <Field label={t.auth.email}>
        <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </Field>
      <Field label={t.auth.password} hint={t.auth.passwordHint}>
        <Input name="password" type="password" required autoComplete="new-password" minLength={8} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText={t.auth.creatingAccount}>
        {t.auth.createAccount}
      </SubmitButton>
    </form>
  );
}
