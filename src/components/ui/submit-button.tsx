"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "./button";
import { useT } from "@/lib/i18n/client";

export function SubmitButton({
  children,
  pendingText,
  ...props
}: ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} {...props}>
      {pending ? (pendingText ?? t.common.saving) : children}
    </Button>
  );
}
