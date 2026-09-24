import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { addWords, createDeck, deleteDeck } from "../_actions/content";
import { visibleSubjects } from "@/lib/subjects";

export const metadata: Metadata = { title: "Vocabulary" };

const FORMAT_HINT = "One per line: word or term | part of speech | definition | example | synonyms";

export default async function AdminVocabulary() {
  const staff = await requireStaff();
  const [own, platform, mastered] = await Promise.all([
    db.vocabDeck.findMany({ where: { centerId: staff.centerId }, include: { _count: { select: { words: true } }, subject: { select: { name: true } } }, orderBy: { title: "asc" } }),
    db.vocabDeck.findMany({ where: { centerId: null }, include: { _count: { select: { words: true } } }, orderBy: { title: "asc" } }),
    db.userWord.groupBy({ by: ["wordId"], where: { box: { gte: 4 }, user: { centerId: staff.centerId } }, _count: true }),
  ]);
  const masteredWords = mastered.length;
  const subjects = await visibleSubjects(staff.centerId);

  return (
    <div className="space-y-6">
      <PageHeader title="Vocabulary" subtitle={`Your students have mastered ${masteredWords} different words and terms. Add flashcard decks for any subject — language vocabulary or key terms.`} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {own.map((d) => (
            <Card key={d.id}>
              <CardHeader
                title={d.title}
                subtitle={`${d._count.words} words · ${d.level}${d.subject ? ` · ${d.subject.name}` : ""}`}
                action={
                  <ConfirmAction action={deleteDeck.bind(null, d.id)} label="Delete deck" confirm={`Delete “${d.title}” and all its words?`}>
                    <Trash2 className="size-4" />
                  </ConfirmAction>
                }
              />
              <CardBody>
                <ActionForm action={addWords.bind(null, d.id)} submitLabel="Add words" submitVariant="secondary" resetOnSuccess>
                  <Field label="Add more words" hint={FORMAT_HINT}>
                    <Textarea name="words" rows={3} className="font-mono text-[13px]" placeholder="lucid | adj. | clear and easy to understand | Her lucid notes helped everyone. | clear, coherent" />
                  </Field>
                </ActionForm>
              </CardBody>
            </Card>
          ))}
          <Card>
            <CardHeader title="Platform decks" subtitle="Available to every student" />
            <CardBody className="flex flex-wrap gap-2">
              {platform.map((d) => <Badge key={d.id}>{d.title} · {d._count.words}</Badge>)}
            </CardBody>
          </Card>
        </div>
        <Card className="self-start">
          <CardHeader title="New deck" />
          <CardBody>
            <ActionForm action={createDeck} submitLabel="Create deck" resetOnSuccess>
              <Field label="Title"><Input name="title" required placeholder="Week 4 words / Chemistry terms" /></Field>
              <Field label="Description"><Input name="description" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Subject">
                  <Select name="subjectId" defaultValue="">
                    <option value="">General</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
                <Field label="Level">
                  <Select name="level" defaultValue="Beginner">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </Select>
                </Field>
              </div>
              <Field label="Words" hint={FORMAT_HINT}>
                <Textarea name="words" rows={8} className="font-mono text-[13px]" />
              </Field>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
