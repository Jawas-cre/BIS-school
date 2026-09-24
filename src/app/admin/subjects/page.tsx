import type { Metadata } from "next";
import { Trash2, X } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { visibleSubjects } from "@/lib/subjects";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { SubjectIcon } from "@/components/subject-icon";
import { SubjectStyleFields } from "./style-fields";
import { addTopic, createSubject, deleteSubject, deleteTopic, updateSubject } from "../_actions/subjects";

export const metadata: Metadata = { title: "Subjects" };

export default async function SubjectsPage() {
  const staff = await requireStaff();
  const subjects = await visibleSubjects(staff.centerId);
  const counts = await db.question.groupBy({ by: ["subjectId"], where: { OR: [{ centerId: null }, { centerId: staff.centerId }] }, _count: true });
  const groupCounts = await db.group.groupBy({ by: ["subjectId"], where: { centerId: staff.centerId }, _count: true });
  const qCount = new Map(counts.map((c) => [c.subjectId, c._count]));
  const gCount = new Map(groupCounts.map((c) => [c.subjectId, c._count]));
  const own = subjects.filter((s) => s.centerId);
  const platform = subjects.filter((s) => !s.centerId);

  return (
    <div className="space-y-6">
      <PageHeader title="Subjects" subtitle="The platform includes ready-made subjects with questions, tests and lessons. Add your own subjects for anything else you teach." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">Your center&apos;s subjects</h2>
            {own.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-sm text-muted">No custom subjects yet — create one with the form.</p>}
            <div className="space-y-4">
              {own.map((s) => (
                <Card key={s.id}>
                  <CardHeader
                    title={<span className="flex items-center gap-3"><SubjectIcon icon={s.icon} color={s.color} size={36} /> {s.name}</span>}
                    subtitle={`${qCount.get(s.id) ?? 0} questions · ${gCount.get(s.id) ?? 0} groups`}
                    action={
                      <ConfirmAction action={deleteSubject.bind(null, s.id)} label="Delete subject" confirm={`Delete ${s.name} with all its topics, questions, tests and lessons?`}>
                        <Trash2 className="size-4" />
                      </ConfirmAction>
                    }
                  />
                  <CardBody className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      {s.topics.map((t) => (
                        <span key={t.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 py-1 pr-1 pl-3 text-sm">
                          {t.name}
                          <ConfirmAction action={deleteTopic.bind(null, t.id)} label={`Remove ${t.name}`} confirm={`Remove the topic “${t.name}” and its questions?`} className="rounded-full p-1">
                            <X className="size-3.5" />
                          </ConfirmAction>
                        </span>
                      ))}
                    </div>
                    <ActionForm action={addTopic.bind(null, s.id)} submitLabel="Add topic" submitVariant="secondary" resetOnSuccess className="flex flex-wrap items-end gap-3 space-y-0" submitClassName="h-11">
                      <Field label="New topic" className="min-w-52 flex-1"><Input name="name" placeholder="e.g. Fractions" /></Field>
                    </ActionForm>
                    <details className="rounded-xl border border-line p-4">
                      <summary className="cursor-pointer text-sm font-semibold">Edit name, color and icon</summary>
                      <ActionForm action={updateSubject.bind(null, s.id)} className="mt-4">
                        <Field label="Name"><Input name="name" defaultValue={s.name} required /></Field>
                        <Field label="Description"><Input name="description" defaultValue={s.description ?? ""} /></Field>
                        <SubjectStyleFields color={s.color} icon={s.icon} />
                      </ActionForm>
                    </details>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">Platform subjects</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {platform.map((s) => (
                <div key={s.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <SubjectIcon icon={s.icon} color={s.color} />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold">{s.name}</div>
                      <div className="text-xs text-muted">{qCount.get(s.id) ?? 0} questions · {gCount.get(s.id) ?? 0} of your groups</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.topics.map((t) => <Badge key={t.id}>{t.name}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <Card className="self-start">
          <CardHeader title="New subject" subtitle="Only your center's students will see it" />
          <CardBody>
            <ActionForm action={createSubject} submitLabel="Create subject" resetOnSuccess>
              <Field label="Name"><Input name="name" placeholder="e.g. Russian Language" required /></Field>
              <Field label="Description"><Input name="description" /></Field>
              <SubjectStyleFields color="#0d9488" icon="book" />
              <Field label="Topics" hint="One per line"><Textarea name="topics" rows={5} placeholder={"Grammar\nReading\nWriting"} /></Field>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
