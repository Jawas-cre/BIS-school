"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { FormMessage } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

export type ActionState = { error?: string; ok?: string } | null;
type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Use as a form's `onSubmit` next to `action={formAction}`. React empties every field once a form
 * action finishes, even when the action returns an error; starting the action here instead keeps
 * what the person typed, so after an error they only fix the wrong field. Submit buttons still
 * show their progress, and without JavaScript the form submits as usual.
 */
export function keepValues(formAction: (formData: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => formAction(formData));
  };
}

/** A form bound to a server action, with inline success/error feedback. */
export function ActionForm({
  action,
  children,
  submitLabel,
  pendingText,
  className,
  resetOnSuccess = false,
  submitVariant,
  submitClassName,
}: {
  action: Action;
  children: ReactNode;
  submitLabel?: ReactNode;
  pendingText?: string;
  className?: string;
  resetOnSuccess?: boolean;
  submitVariant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  submitClassName?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} onSubmit={keepValues(formAction)} className={cn("space-y-4", className)}>
      {children}
      <FormMessage state={state} />
      <SubmitButton pendingText={pendingText} variant={submitVariant} className={submitClassName}>
        {submitLabel ?? t.common.save}
      </SubmitButton>
    </form>
  );
}

/** A one-click destructive action that asks for confirmation first. */
export function ConfirmAction({
  action,
  label,
  confirm,
  className,
  children,
}: {
  action: () => Promise<unknown>;
  label: string;
  confirm: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <form
      action={async () => {
        await action();
      }}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        aria-label={label}
        title={label}
        className={cn("inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-muted hover:bg-danger-soft hover:text-danger", className)}
      >
        {children ?? label}
      </button>
    </form>
  );
}
