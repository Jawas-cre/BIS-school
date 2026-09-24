"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { FormMessage } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { cn } from "@/lib/utils";

export type ActionState = { error?: string; ok?: string } | null;
type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/** A form bound to a server action, with inline success/error feedback. */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
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
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={cn("space-y-4", className)}>
      {children}
      <FormMessage state={state} />
      <SubmitButton pendingText={pendingText} variant={submitVariant} className={submitClassName}>
        {submitLabel}
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
