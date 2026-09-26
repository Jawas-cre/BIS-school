import { Trash2, X } from "lucide-react";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { visibleSubjects } from "@/lib/subjects";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { SubjectIcon } from "@/components/subject-icon";
import { SubjectStyleFields } from "./style-fields";
import { addTopic, createSubject, deleteSubject, deleteTopic, updateSubject } from "../_actions/subjects";
import { fmt, plural } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.subjects);

export default async function SubjectsPage() {
  const staff = await requireCenterAdmin();
  const t = await getT();
  const S = t.adminSubjects;
  const subjects = await visibleSubjects(staff.centerId);
  const counts = await db.question.groupBy({ by: ["subjectId"], where: { OR: [{ centerId: null }, { centerId: staff.centerId }] }, _count: true });
  const groupCounts = await db.group.groupBy({ by: ["subjectId"], where: { centerId: staff.centerId }, _count: true });
  const qCount = new Map(counts.map((c) => [c.subjectId, c._count]));
  const gCount = new Map(groupCounts.map((c) => [c.subjectId, c._count]));
  const own = subjects.filter((s) => s.centerId);
  const platform = subjects.filter((s) => !s.centerId);

  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.subjects} subtitle={S.subtitle} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">{S.yourSubjects}</h2>
            {own.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-sm text-muted">{S.noCustom}</p>}
            <div className="space-y-4">
              {own.map((s) => (
                <Card key={s.id}>
                  <CardHeader
                    title={<span className="flex items-center gap-3"><SubjectIcon icon={s.icon} color={s.color} size={36} /> {s.name}</span>}
                    subtitle={`${plural(t.common.questions, qCount.get(s.id) ?? 0)} · ${plural(t.common.groups, gCount.get(s.id) ?? 0)}`}
                    action={
                      <ConfirmAction action={deleteSubject.bind(null, s.id)} label={S.deleteSubject} confirm={fmt(S.deleteConfirm, { name: s.name })}>
                        <Trash2 className="size-4" />
                      </ConfirmAction>
                    }
                  />
                  <CardBody className="space-y-5">
                    <div className="flex flex-wrap gap-2">
                      {s.topics.map((topic) => (
                        <span key={topic.id} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 py-1 pr-1 pl-3 text-sm">
                          {topic.name}
                          <ConfirmAction action={deleteTopic.bind(null, topic.id)} label={fmt(S.removeTopic, { name: topic.name })} confirm={fmt(S.removeTopicConfirm, { name: topic.name })} className="rounded-full p-1">
                            <X className="size-3.5" />
                          </ConfirmAction>
                        </span>
                      ))}
                    </div>
                    <ActionForm action={addTopic.bind(null, s.id)} submitLabel={S.addTopic} submitVariant="secondary" resetOnSuccess className="flex flex-wrap items-end gap-3 space-y-0" submitClassName="h-11">
                      <Field label={S.newTopic} className="min-w-52 flex-1"><Input name="name" placeholder={S.topicPlaceholder} /></Field>
                    </ActionForm>
                    <details className="rounded-xl border border-line p-4">
                      <summary className="cursor-pointer text-sm font-semibold">{S.editStyle}</summary>
                      <ActionForm action={updateSubject.bind(null, s.id)} className="mt-4">
                        <Field label={S.name}><Input name="name" defaultValue={s.name} required /></Field>
                        <Field label={S.description}><Input name="description" defaultValue={s.description ?? ""} /></Field>
                        <SubjectStyleFields color={s.color} icon={s.icon} />
                      </ActionForm>
                    </details>
                  </CardBody>
                </Card>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-display text-lg font-bold">{S.platformSubjects}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {platform.map((s) => (
                <div key={s.id} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
                  <div className="flex items-center gap-3">
                    <SubjectIcon icon={s.icon} color={s.color} />
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold">{s.name}</div>
                      <div className="text-xs text-muted">{plural(t.common.questions, qCount.get(s.id) ?? 0)} · {fmt(S.ofYourGroups, { n: gCount.get(s.id) ?? 0 })}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.topics.map((topic) => <Badge key={topic.id}>{topic.name}</Badge>)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
        <Card className="self-start">
          <CardHeader title={S.newSubject} subtitle={S.newSubjectSub} />
          <CardBody>
            <ActionForm action={createSubject} submitLabel={S.createSubject} resetOnSuccess>
              <Field label={S.name}><Input name="name" placeholder={S.namePlaceholder} required /></Field>
              <Field label={S.description}><Input name="description" /></Field>
              <SubjectStyleFields color="#0d9488" icon="book" />
              <Field label={S.topics} hint={S.topicsHint}><Textarea name="topics" rows={5} placeholder={S.topicsPlaceholder} /></Field>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
