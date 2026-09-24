import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { deleteUniversity, saveUniversity } from "../actions";

export const metadata: Metadata = { title: "Universities" };

type Uni = Awaited<ReturnType<typeof db.university.findMany>>[number];

function UniFields({ u }: { u?: Uni }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <Field label="Name" className="sm:col-span-2"><Input name="name" defaultValue={u?.name} required /></Field>
      <Field label="Country"><Input name="country" defaultValue={u?.country} required /></Field>
      <Field label="City"><Input name="city" defaultValue={u?.city} required /></Field>
      <Field label="Rank"><Input name="rank" type="number" defaultValue={u?.rank} required /></Field>
      <Field label="Acceptance %" hint="Leave empty if unknown"><Input name="acceptanceRate" type="number" step="0.1" defaultValue={u?.acceptanceRate ?? ""} /></Field>
      <Field label="Tuition (USD / year)" hint="Leave empty if unknown"><Input name="tuition" type="number" defaultValue={u?.tuition ?? ""} /></Field>
      <Field label="Latitude"><Input name="lat" type="number" step="any" defaultValue={u?.lat} required /></Field>
      <Field label="Longitude"><Input name="lng" type="number" step="any" defaultValue={u?.lng} required /></Field>
      <Field label="Website"><Input name="website" type="url" defaultValue={u?.website} required /></Field>
      <Field label="Financial aid" className="sm:col-span-2"><Input name="aid" defaultValue={u?.aid} /></Field>
      <Field label="About" className="sm:col-span-2"><Textarea name="about" rows={2} defaultValue={u?.about} /></Field>
      <Field label="Admission requirements" className="sm:col-span-4"><Textarea name="requirements" rows={2} defaultValue={u?.requirements} required /></Field>
    </div>
  );
}

export default async function PlatformUniversities() {
  await requireSuperAdmin();
  const unis = await db.university.findMany({ orderBy: { rank: "asc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Universities" subtitle="Shown to every student in Top Universities. Keep the figures up to date each admissions cycle." />
      <Card>
        <CardHeader title="Add a university" />
        <CardBody>
          <ActionForm action={saveUniversity.bind(null, null)} submitLabel="Add university" resetOnSuccess>
            <UniFields />
          </ActionForm>
        </CardBody>
      </Card>
      <div className="space-y-2">
        {unis.map((u) => (
          <details key={u.id} className="rounded-2xl border border-line bg-surface shadow-card">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3">
              <span className="w-8 text-sm font-bold text-muted">#{u.rank}</span>
              <span className="flex-1 font-semibold">{u.name}</span>
              <span className="text-sm text-muted">{u.city}, {u.country}</span>
            </summary>
            <div className="border-t border-line p-5">
              <ActionForm action={saveUniversity.bind(null, u.id)} submitLabel="Save">
                <UniFields u={u} />
              </ActionForm>
              <div className="mt-3 flex justify-end">
                <ConfirmAction action={deleteUniversity.bind(null, u.id)} label="Delete" confirm={`Delete ${u.name}?`}><Trash2 className="size-4" /> Delete</ConfirmAction>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
