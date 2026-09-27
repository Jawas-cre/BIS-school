import { Field, Input, Textarea } from "@/components/ui/form";
import type { SiteKind } from "@/lib/site";
import type { Dict } from "@/lib/i18n/dictionaries";

type Item = { title: string; subtitle: string | null; meta: string | null; body: string | null };

/** The fields of a course, a student result or a question on the website, for adding or editing one. */
export function SiteItemFields({ kind, item, W }: { kind: SiteKind; item?: Item; W: Dict["siteAdmin"] }) {
  const F = W.fields[kind];
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={F.title} className={kind === "FAQ" ? "sm:col-span-2" : undefined}>
          <Input name="title" defaultValue={item?.title} placeholder={F.titlePlaceholder} required maxLength={120} />
        </Field>
        {kind !== "FAQ" && (
          <Field label={W.fields[kind].subtitle}>
            <Input name="subtitle" defaultValue={item?.subtitle ?? ""} placeholder={W.fields[kind].subtitlePlaceholder} required={kind === "RESULT"} maxLength={80} />
          </Field>
        )}
      </div>
      {kind === "COURSE" && (
        <Field label={W.fields.COURSE.meta} hint={W.fields.COURSE.metaHint}>
          <Input name="meta" defaultValue={item?.meta ?? ""} placeholder={W.fields.COURSE.metaPlaceholder} maxLength={60} />
        </Field>
      )}
      <Field label={F.body}>
        <Textarea name="body" defaultValue={item?.body ?? ""} placeholder={F.bodyPlaceholder} rows={kind === "FAQ" ? 3 : 2} required={kind === "FAQ"} maxLength={1000} />
      </Field>
    </>
  );
}
