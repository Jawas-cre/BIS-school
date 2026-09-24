import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { deleteUniversity, saveUniversity } from "../actions";
import type { Dict } from "@/lib/i18n/dictionaries";
import { fmt } from "@/lib/i18n/format";
import { countryName } from "@/lib/i18n/labels";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.platformUniversities);

type Uni = Awaited<ReturnType<typeof db.university.findMany>>[number];

function UniFields({ u, t }: { u?: Uni; t: Dict }) {
  const F = t.platform.fields;
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Field label={F.name} className="sm:col-span-2"><Input name="name" defaultValue={u?.name} required /></Field>
      <Field label={F.country}><Input name="country" defaultValue={u?.country} required /></Field>
      <Field label={F.city}><Input name="city" defaultValue={u?.city} required /></Field>
      <Field label={F.rank}><Input name="rank" type="number" defaultValue={u?.rank} required /></Field>
      <Field label={F.acceptanceRate} hint={t.platform.unknownHint}><Input name="acceptanceRate" type="number" step="0.1" defaultValue={u?.acceptanceRate ?? ""} /></Field>
      <Field label={F.tuition} hint={t.platform.unknownHint}><Input name="tuition" type="number" defaultValue={u?.tuition ?? ""} /></Field>
      <Field label={F.lat}><Input name="lat" type="number" step="any" defaultValue={u?.lat} required /></Field>
      <Field label={F.lng}><Input name="lng" type="number" step="any" defaultValue={u?.lng} required /></Field>
      <Field label={F.website}><Input name="website" type="url" defaultValue={u?.website} required /></Field>
      <Field label={F.aid} className="sm:col-span-2"><Input name="aid" defaultValue={u?.aid} /></Field>
      <Field label={F.about} className="sm:col-span-2"><Textarea name="about" rows={2} defaultValue={u?.about} /></Field>
      <Field label={F.requirements} className="sm:col-span-4"><Textarea name="requirements" rows={2} defaultValue={u?.requirements} required /></Field>
    </div>
  );
}

export default async function PlatformUniversities() {
  await requireSuperAdmin();
  const t = await getT();
  const P = t.platform;
  const unis = await db.university.findMany({ orderBy: { rank: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.platformUniversities} subtitle={P.unisSub} />
      <Card>
        <CardHeader title={P.addUni} />
        <CardBody>
          <ActionForm action={saveUniversity.bind(null, null)} submitLabel={P.addUniButton} resetOnSuccess>
            <UniFields t={t} />
          </ActionForm>
        </CardBody>
      </Card>
      <div className="space-y-2">
        {unis.map((u) => (
          <details key={u.id} className="rounded-2xl border border-line bg-surface shadow-card">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3">
              <span className="w-8 text-sm font-bold text-muted">#{u.rank}</span>
              <span className="flex-1 font-semibold">{u.name}</span>
              <span className="text-sm text-muted">{u.city}, {countryName(t, u.country)}</span>
            </summary>
            <div className="border-t border-line p-5">
              <ActionForm action={saveUniversity.bind(null, u.id)}>
                <UniFields u={u} t={t} />
              </ActionForm>
              <div className="mt-3 flex justify-end">
                <ConfirmAction action={deleteUniversity.bind(null, u.id)} label={t.common.delete} confirm={fmt(P.deleteConfirm, { name: u.name })}><Trash2 className="size-4" /> {t.common.delete}</ConfirmAction>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
