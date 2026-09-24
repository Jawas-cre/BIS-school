"use client";

import { useActionState } from "react";
import { login } from "../actions";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useT } from "@/lib/i18n/client";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(login, null);
  const t = useT();
  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label={t.auth.email}>
        <Input name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      </Field>
      <Field label={t.auth.password}>
        <Input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText={t.auth.loggingIn}>
        {t.auth.logIn}
      </SubmitButton>
    </form>
  );
}
