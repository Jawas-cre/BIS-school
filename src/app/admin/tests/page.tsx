import type { Metadata } from "next";
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

export const metadata: Metadata = { title: "Mock tests" };

export default async function AdminTests() {
  const staff = await requireStaff();
  const [own, platform, attempts] = await Promise.all([
    db.test.findMany({ where: { centerId: staff.centerId }, orderBy: { createdAt: "desc" }, include: { subject: true, modules: { include: { _count: { select: { questions: true } } } } } }),
    db.test.findMany({ where: { centerId: null }, orderBy: [{ subjectId: "asc" }, { kind: "asc" }, { title: "asc" }], include: { subject: true, modules: { include: { _count: { select: { questions: true } } } } } }),
    db.testAttempt.groupBy({ by: ["testId"], where: { status: "COMPLETED", user: { centerId: staff.centerId } }, _count: true, _avg: { score: true } }),
  ]);
  const subjects = await visibleSubjects(staff.centerId);
  const stats = new Map(attempts.map((a) => [a.testId, a]));
  const row = (t: (typeof own)[number], mine: boolean) => {
    const s = stats.get(t.id);
    const questions = t.modules.reduce((n, m) => n + m._count.questions, 0);
    const minutes = t.modules.reduce((n, m) => n + m.minutes, 0);
    const avg = s?._avg.score != null ? Math.round(s._avg.score) : null;
    return (
      <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            {t.title}
            {t.subject ? <SubjectBadge name={t.subject.name} color={t.subject.color} /> : <Badge>Mixed</Badge>}
          </div>
          <div className="text-xs text-muted">{questions} questions · {minutes} min · {t.kind.toLowerCase()}</div>
        </div>
        <span className="text-sm text-ink-2 tabular-nums">{s?._count ?? 0} taken{avg !== null ? ` · avg ${avg}%` : ""}</span>
        {mine ? (
          <>
            <Badge tone={t.published ? "success" : "neutral"}>{t.published ? "Published" : "Hidden"}</Badge>
            <form action={toggleTestPublished.bind(null, t.id)}>
              <button className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label={t.published ? "Hide" : "Publish"} title={t.published ? "Hide from students" : "Publish"}>
                {t.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </form>
            <ConfirmAction action={deleteTest.bind(null, t.id)} label="Delete test" confirm={`Delete “${t.title}” and its results?`}>
              <Trash2 className="size-4" />
            </ConfirmAction>
          </>
        ) : (
          <Badge>Platform</Badge>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Mock tests" subtitle="Platform tests are available to every student. Build your own timed tests for any subject from the question bank — for homework, class quizzes or monthly exams." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Your center's tests" />
            <CardBody className="p-0 pt-3">
              <ul className="divide-y divide-line">{own.map((t) => row(t, true))}</ul>
              {own.length === 0 && <p className="px-5 pb-6 text-sm text-muted">No custom tests yet. Build one with the form →</p>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Platform tests" />
            <CardBody className="p-0 pt-3">
              <ul className="divide-y divide-line">{platform.map((t) => row(t, false))}</ul>
            </CardBody>
          </Card>
        </div>
        <Card className="self-start">
          <CardHeader title="Build a test" subtitle="Questions are picked at random from the bank, easiest first" />
          <CardBody>
            <ActionForm action={createTestFromBank} submitLabel="Create & publish" resetOnSuccess>
              <Field label="Title"><Input name="title" placeholder="Week 3 quiz" required /></Field>
              <Field label="Description"><Textarea name="description" rows={2} /></Field>
              <SubjectTopicFields subjects={subjects} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Difficulty">
                  <Select name="difficulty" defaultValue="ANY">
                    <option value="ANY">Mixed</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </Select>
                </Field>
                <Field label="Questions"><Input name="count" type="number" min={3} max={60} defaultValue={10} /></Field>
                <Field label="Minutes"><Input name="minutes" type="number" min={3} max={180} defaultValue={15} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="onlyCenter" className="size-4 accent-[var(--brand)]" /> Only use my center&apos;s questions
              </label>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
