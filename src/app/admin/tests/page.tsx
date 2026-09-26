import { Eye, EyeOff, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { visibleSubjects } from "@/lib/subjects";
import { SubjectBadge } from "@/components/subject-icon";
import { SubjectTopicFields } from "../subject-topic-fields";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { createTestFromBank, deleteTest, toggleTestPublished } from "../_actions/content";
import { fmt, plural } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.tests);

export default async function AdminTests() {
  const staff = await requireStaff();
  const t = await getT();
  const T = t.adminTests;
  const [own, platform, attempts] = await Promise.all([
    db.test.findMany({ where: { centerId: staff.centerId }, orderBy: { createdAt: "desc" }, include: { subject: true, modules: { include: { _count: { select: { questions: true } } } } } }),
    db.test.findMany({ where: { centerId: null }, orderBy: [{ subjectId: "asc" }, { kind: "asc" }, { title: "asc" }], include: { subject: true, modules: { include: { _count: { select: { questions: true } } } } } }),
    db.testAttempt.groupBy({ by: ["testId"], where: { status: "COMPLETED", user: { centerId: staff.centerId } }, _count: true, _avg: { score: true } }),
  ]);
  const subjects = await visibleSubjects(staff.centerId);
  const stats = new Map(attempts.map((a) => [a.testId, a]));
  const row = (test: (typeof own)[number], mine: boolean) => {
    const s = stats.get(test.id);
    const questions = test.modules.reduce((n, m) => n + m._count.questions, 0);
    const minutes = test.modules.reduce((n, m) => n + m.minutes, 0);
    const avg = s?._avg.score != null ? Math.round(s._avg.score) : null;
    return (
      <li key={test.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            {test.title}
            {test.subject ? <SubjectBadge name={test.subject.name} color={test.subject.color} /> : <Badge>{t.common.mixed}</Badge>}
          </div>
          <div className="text-xs text-muted">
            {plural(t.common.questions, questions)} · {fmt(t.tests.minutesShort, { n: minutes })} · {T.kinds[test.kind as keyof typeof T.kinds] ?? test.kind.toLowerCase()}
          </div>
        </div>
        <span className="text-sm text-ink-2 tabular-nums">{fmt(T.taken, { n: s?._count ?? 0 })}{avg !== null ? fmt(T.avg, { pct: avg }) : ""}</span>
        {mine ? (
          <>
            <Badge tone={test.published ? "success" : "neutral"}>{test.published ? t.common.published : t.common.hidden}</Badge>
            <form action={toggleTestPublished.bind(null, test.id)}>
              <button className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label={test.published ? T.hide : T.publish} title={test.published ? T.hideTitle : T.publish}>
                {test.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </form>
            <ConfirmAction action={deleteTest.bind(null, test.id)} label={T.deleteLabel} confirm={fmt(T.deleteConfirm, { title: test.title })}>
              <Trash2 className="size-4" />
            </ConfirmAction>
          </>
        ) : (
          <Badge>{t.common.platform}</Badge>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.tests} subtitle={T.subtitle} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title={T.yourTests} />
            <CardBody className="p-0 pt-3">
              <ul className="divide-y divide-line">{own.map((test) => row(test, true))}</ul>
              {own.length === 0 && <p className="px-5 pb-6 text-sm text-muted">{T.noTests}</p>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={T.platformTests} />
            <CardBody className="p-0 pt-3">
              <ul className="divide-y divide-line">{platform.map((test) => row(test, false))}</ul>
            </CardBody>
          </Card>
        </div>
        <Card className="self-start">
          <CardHeader title={T.buildTitle} subtitle={T.buildSub} />
          <CardBody>
            <ActionForm action={createTestFromBank} submitLabel={T.createPublish} resetOnSuccess>
              <Field label={T.title}><Input name="title" placeholder={T.titlePlaceholder} required /></Field>
              <Field label={T.description}><Textarea name="description" rows={2} /></Field>
              <SubjectTopicFields subjects={subjects.map((s) => ({ id: s.id, name: s.name, topics: s.topics.map((x) => ({ id: x.id, name: x.name })) }))} />
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.difficulty.label}>
                  <Select name="difficulty" defaultValue="ANY">
                    <option value="ANY">{t.difficulty.mixed}</option>
                    <option value="EASY">{t.difficulty.EASY}</option>
                    <option value="MEDIUM">{t.difficulty.MEDIUM}</option>
                    <option value="HARD">{t.difficulty.HARD}</option>
                  </Select>
                </Field>
                <Field label={T.questions}><Input name="count" type="number" min={3} max={60} defaultValue={10} /></Field>
                <Field label={T.minutes}><Input name="minutes" type="number" min={3} max={180} defaultValue={15} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="onlyCenter" className="size-4 accent-[var(--brand)]" /> {T.onlyCenter}
              </label>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
