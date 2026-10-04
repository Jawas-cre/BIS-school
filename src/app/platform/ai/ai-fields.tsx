"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/form";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

type Provider = "off" | "claude" | "omniroute";

/** The connection choice, with only the chosen connection's fields shown. */
export function AiFields({
  defaults,
  offText,
}: {
  defaults: { provider: Provider; claudeModel: string; claudeKeySaved: string; omnirouteUrl: string; omnirouteModel: string; omnirouteKeySaved: string };
  /** What "Off" means where these settings are shown (BIS Learn's AI tutor by default). */
  offText?: string;
}) {
  const t = useT();
  const P = t.aiSettings;
  const [provider, setProvider] = useState<Provider>(defaults.provider);
  const options: { value: Provider; title: string; text: string }[] = [
    { value: "omniroute", title: P.omniroute, text: P.omnirouteText },
    { value: "claude", title: P.claude, text: P.claudeText },
    { value: "off", title: P.off, text: offText ?? P.offText },
  ];
  return (
    <>
      <fieldset className="grid gap-2 sm:grid-cols-3">
        <legend className="sr-only">{P.connection}</legend>
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "cursor-pointer rounded-xl border p-3.5",
              provider === o.value ? "border-brand bg-brand-soft ring-2 ring-brand/30" : "border-line hover:border-line-strong",
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              <input type="radio" name="provider" value={o.value} checked={provider === o.value} onChange={() => setProvider(o.value)} className="accent-[var(--brand)]" />
              {o.title}
            </span>
            <span className="mt-1 block text-xs text-muted">{o.text}</span>
          </label>
        ))}
      </fieldset>

      <div className={cn("grid gap-3 sm:grid-cols-3", provider !== "omniroute" && "hidden")}>
        <Field label={P.address} hint={P.addressHint}>
          <Input name="omnirouteUrl" defaultValue={defaults.omnirouteUrl} placeholder="http://localhost:20128" />
        </Field>
        <Field label={P.model} hint={P.omnirouteModelHint}>
          <Input name="omnirouteModel" defaultValue={defaults.omnirouteModel} placeholder="auto" />
        </Field>
        <Field label={P.keyOptional} hint={defaults.omnirouteKeySaved ? P.keySaved : P.omnirouteKeyHint}>
          <Input name="omnirouteKey" type="password" autoComplete="off" placeholder={defaults.omnirouteKeySaved} />
        </Field>
      </div>

      <div className={cn("grid gap-3 sm:grid-cols-2", provider !== "claude" && "hidden")}>
        <Field label={P.apiKey} hint={defaults.claudeKeySaved ? P.keySaved : P.claudeKeyHint}>
          <Input name="claudeKey" type="password" autoComplete="off" placeholder={defaults.claudeKeySaved || "sk-ant-…"} />
        </Field>
        <Field label={P.model}>
          <Input name="claudeModel" defaultValue={defaults.claudeModel} />
        </Field>
      </div>
    </>
  );
}
