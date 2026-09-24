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
import { fmt, plural } from "@/lib/i18n/format";
import { deckLevel } from "@/lib/i18n/labels";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.vocabulary);

export default async function AdminVocabulary() {
  const staff = await requireStaff();
  const t = await getT();
  const V = t.adminVocab;
  const [own, platform, mastered] = await Promise.all([
    db.vocabDeck.findMany({ where: { centerId: staff.centerId }, include: { _count: { select: { words: true } }, subject: { select: { name: true } } }, orderBy: { title: "asc" } }),
    db.vocabDeck.findMany({ where: { centerId: null }, include: { _count: { select: { words: true } } }, orderBy: { title: "asc" } }),
    db.userWord.groupBy({ by: ["wordId"], where: { box: { gte: 4 }, user: { centerId: staff.centerId } }, _count: true }),
  ]);
  const masteredWords = mastered.length;
  const subjects = await visibleSubjects(staff.centerId);

  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.vocabulary} subtitle={fmt(V.subtitle, { n: masteredWords })} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {own.map((d) => (
            <Card key={d.id}>
              <CardHeader
                title={d.title}
                subtitle={`${fmt(V.deckInfo, { words: plural(t.common.words, d._count.words), level: deckLevel(t, d.level) })}${d.subject ? ` · ${d.subject.name}` : ""}`}
                action={
                  <ConfirmAction action={deleteDeck.bind(null, d.id)} label={V.deleteDeck} confirm={fmt(V.deleteConfirm, { title: d.title })}>
                    <Trash2 className="size-4" />
                  </ConfirmAction>
                }
              />
              <CardBody>
                <ActionForm action={addWords.bind(null, d.id)} submitLabel={V.addWords} submitVariant="secondary" resetOnSuccess>
                  <Field label={V.addMore} hint={V.formatHint}>
                    <Textarea name="words" rows={3} className="font-mono text-[13px]" placeholder={V.wordsPlaceholder} />
                  </Field>
                </ActionForm>
              </CardBody>
            </Card>
          ))}
          <Card>
            <CardHeader title={V.platformDecks} subtitle={V.platformDecksSub} />
            <CardBody className="flex flex-wrap gap-2">
              {platform.map((d) => <Badge key={d.id}>{d.title} · {d._count.words}</Badge>)}
            </CardBody>
          </Card>
        </div>
        <Card className="self-start">
          <CardHeader title={V.newDeck} />
          <CardBody>
            <ActionForm action={createDeck} submitLabel={V.createDeck} resetOnSuccess>
              <Field label={V.title}><Input name="title" required placeholder={V.titlePlaceholder} /></Field>
              <Field label={V.description}><Input name="description" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.adminSubjects.subject}>
                  <Select name="subjectId" defaultValue="">
                    <option value="">{V.general}</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
                <Field label={V.level}>
                  <Select name="level" defaultValue="Beginner">
                    {(["Beginner", "Intermediate", "Advanced"] as const).map((l) => (
                      <option key={l} value={l}>{t.vocab.levels[l]}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label={V.words} hint={V.formatHint}>
                <Textarea name="words" rows={8} className="font-mono text-[13px]" />
              </Field>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
