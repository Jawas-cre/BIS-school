import { ExternalLink, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { createLibraryItem, deleteLibraryItem } from "../_actions/content";
import { visibleSubjects } from "@/lib/subjects";
import { fmt } from "@/lib/i18n/format";
import { libraryCategory } from "@/lib/i18n/labels";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.library);

export default async function AdminLibrary() {
  const staff = await requireStaff();
  const t = await getT();
  const L = t.adminLibrary;
  const [own, platformCount] = await Promise.all([
    db.libraryItem.findMany({ where: { centerId: staff.centerId }, orderBy: { createdAt: "desc" }, include: { subject: { select: { name: true } } } }),
    db.libraryItem.count({ where: { centerId: null } }),
  ]);
  const subjects = await visibleSubjects(staff.centerId);
  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.library} subtitle={fmt(L.subtitle, { n: platformCount })} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardBody className="p-0">
            <ul className="divide-y divide-line">
              {own.map((i) => (
                <li key={i.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <a href={i.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold hover:text-brand">
                      {i.title} <ExternalLink className="size-3.5" />
                    </a>
                    <div className="text-xs text-muted">{[i.subject?.name, i.author, i.description].filter(Boolean).join(" · ")}</div>
                  </div>
                  <Badge>{libraryCategory(t, i.category)}</Badge>
                  <ConfirmAction action={deleteLibraryItem.bind(null, i.id)} label={t.common.delete} confirm={fmt(L.removeConfirm, { title: i.title })}><Trash2 className="size-4" /></ConfirmAction>
                </li>
              ))}
              {own.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">{L.empty}</li>}
            </ul>
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title={L.addTitle} subtitle={L.addSub} />
          <CardBody>
            <ActionForm action={createLibraryItem} submitLabel={L.addResource} resetOnSuccess>
              <Field label={L.title}><Input name="title" required /></Field>
              <Field label={L.link}><Input name="url" type="url" placeholder="https://" required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={L.category}>
                  <Select name="category" defaultValue="GUIDE">
                    <option value="BOOK">{L.categoryOptions.BOOK}</option>
                    <option value="PRACTICE">{L.categoryOptions.PRACTICE}</option>
                    <option value="GUIDE">{L.categoryOptions.GUIDE}</option>
                    <option value="VIDEO">{L.categoryOptions.VIDEO}</option>
                  </Select>
                </Field>
                <Field label={L.pages}><Input name="pages" type="number" min={1} /></Field>
              </div>
              <Field label={t.adminSubjects.subject}>
                <Select name="subjectId" defaultValue="">
                  <option value="">{L.general}</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label={L.author}><Input name="author" /></Field>
              <Field label={L.description}><Textarea name="description" rows={2} /></Field>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
