"use client";

import { useActionState } from "react";
import { registerCenter } from "../../actions";
import { Field, FormMessage, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";

export function CenterForm() {
  const [state, action] = useActionState(registerCenter, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <Field label="Center name">
          <Input name="centerName" required placeholder="Bright Future Academy" />
        </Field>
        <Field label="City">
          <Input name="city" placeholder="Tashkent" />
        </Field>
      </div>
      <Field label="Your name">
        <Input name="name" required autoComplete="name" placeholder="Director's full name" />
      </Field>
      <Field label="Work email">
        <Input name="email" type="email" required autoComplete="email" />
      </Field>
      <Field label="Password" hint="At least 8 characters">
        <Input name="password" type="password" required autoComplete="new-password" minLength={8} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText="Setting up your center…">
        Create center
      </SubmitButton>
    </form>
  );
}
