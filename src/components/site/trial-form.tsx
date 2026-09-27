"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { keepValues, type ActionState } from "@/components/action-form";
import { useT } from "@/lib/i18n/client";

/** The free trial lesson form on a center's website. */
export function TrialForm({
  action,
  courses,
  branches,
}: {
  action: (state: ActionState, fd: FormData) => Promise<ActionState>;
  courses: string[];
  branches: string[];
}) {
  const t = useT();
  const S = t.site;
  const [state, formAction] = useActionState(action, null);
  if (state?.ok) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="size-10 text-success" />
        <p className="font-display text-xl font-bold">{S.thanks}</p>
        <p className="text-muted">{state.ok}</p>
      </div>
    );
  }
  return (
    <form action={formAction} onSubmit={keepValues(formAction)} className="space-y-3">
      {/* Hidden from people; bots fill it in. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={S.yourName}>
          <Input name="name" required autoComplete="name" />
        </Field>
        <Field label={S.phone}>
          <Input name="phone" type="tel" required autoComplete="tel" placeholder="+998 90 123 45 67" />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {courses.length > 0 && (
          <Field label={S.course}>
            <Select name="course" defaultValue="">
              <option value="">{S.notSure}</option>
              {courses.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
        )}
        {branches.length > 1 && (
          <Field label={S.branch}>
            <Select name="branch" defaultValue="">
              <option value="">{S.anyBranch}</option>
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </Select>
          </Field>
        )}
      </div>
      <Field label={S.time}>
        <Input name="time" placeholder={S.timePlaceholder} />
      </Field>
      <Field label={S.message}>
        <Textarea name="message" rows={2} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton size="lg" className="w-full" pendingText={S.sending}>
        {S.book}
      </SubmitButton>
      <p className="text-center text-xs text-muted">{S.privacy}</p>
    </form>
  );
}
