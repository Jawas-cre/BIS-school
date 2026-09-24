"use client";

import { useState } from "react";
import { Field, Input, Select } from "@/components/ui/form";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

/** Who the code is for; the group choice only applies to student codes. */
export function CodeFields({ groups }: { groups: { id: string; name: string }[] }) {
  const C = useT().codes;
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  return (
    <>
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-ink">{C.forWho}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["STUDENT", "TEACHER"] as const).map((r) => (
            <label
              key={r}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                role === r ? "border-brand bg-brand-soft text-brand" : "border-line-strong hover:bg-surface-2",
              )}
            >
              <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="size-4 accent-[var(--brand)]" />
              {r === "STUDENT" ? C.student : C.teacher}
            </label>
          ))}
        </div>
      </fieldset>
      {role === "STUDENT" && (
        <Field label={C.group} hint={C.groupHint}>
          <Select name="groupId" defaultValue="">
            <option value="">{C.noGroup}</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </Select>
        </Field>
      )}
      <Field label={C.label}>
        <Input name="label" maxLength={60} placeholder={C.labelPlaceholder} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={C.maxUses} hint={C.maxUsesHint}>
          <Input name="maxUses" type="number" min={1} max={10000} />
        </Field>
        <Field label={C.expires} hint={C.expiresHint}>
          <Input name="expiresOn" type="date" />
        </Field>
      </div>
    </>
  );
}
