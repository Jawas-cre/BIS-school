import type { Metadata } from "next";
import { ExternalLink, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { createLibraryItem, deleteLibraryItem } from "../_actions/content";

export const metadata: Metadata = { title: "Library" };

export default async function AdminLibrary() {
  const staff = await requireStaff();
  const [own, platformCount] = await Promise.all([
    db.libraryItem.findMany({ where: { centerId: staff.centerId }, orderBy: { createdAt: "desc" } }),
    db.libraryItem.count({ where: { centerId: null } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Library" subtitle={`Share books, PDFs, videos and links with your students. ${platformCount} platform resources are included automatically.`} />
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
                    <div className="text-xs text-muted">{[i.author, i.description].filter(Boolean).join(" · ")}</div>
                  </div>
                  <Badge>{i.category.toLowerCase()}</Badge>
                  <ConfirmAction action={deleteLibraryItem.bind(null, i.id)} label="Delete" confirm={`Remove “${i.title}”?`}><Trash2 className="size-4" /></ConfirmAction>
                </li>
              ))}
              {own.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">You haven&apos;t added any resources yet.</li>}
            </ul>
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title="Add a resource" subtitle="Link to a PDF, Google Drive file, video or website" />
          <CardBody>
            <ActionForm action={createLibraryItem} submitLabel="Add resource" resetOnSuccess>
              <Field label="Title"><Input name="title" required /></Field>
              <Field label="Link"><Input name="url" type="url" placeholder="https://" required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <Select name="category" defaultValue="GUIDE">
                    <option value="BOOK">Book</option>
                    <option value="PRACTICE">Practice</option>
                    <option value="GUIDE">Guide</option>
                    <option value="VIDEO">Video</option>
                  </Select>
                </Field>
                <Field label="Pages"><Input name="pages" type="number" min={1} /></Field>
              </div>
              <Field label="Author"><Input name="author" /></Field>
              <Field label="Description"><Textarea name="description" rows={2} /></Field>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
