"use client";

import { useActionState } from "react";
import { registerStudent } from "../actions";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function RegisterForm({ code }: { code: string }) {
  const [state, action] = useActionState(registerStudent, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <Field label="Center invite code" hint="6 characters, e.g. K7Q2MX">
        <Input
          name="code"
          required
          defaultValue={code}
          placeholder="K7Q2MX"
          className="font-mono tracking-[0.3em] uppercase"
          maxLength={12}
        />
      </Field>
      <Field label="Full name">
        <Input name="name" required autoComplete="name" placeholder="Aziza Karimova" />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
      </Field>
      <Field label="Password" hint="At least 8 characters">
        <Input name="password" type="password" required autoComplete="new-password" minLength={8} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Creating account…">
        Create account
      </SubmitButton>
    </form>
  );
}
