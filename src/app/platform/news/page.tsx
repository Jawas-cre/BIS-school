import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { createPlatformNews, deletePlatformNews } from "../actions";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Platform announcements" };

export default async function PlatformNews() {
  await requireSuperAdmin();
  const posts = await db.newsPost.findMany({ where: { centerId: null }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <PageHeader title="Platform announcements" subtitle="Shown to students of every center." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><Badge>{p.tag}</Badge><span className="text-xs text-muted">{formatDate(p.createdAt)}</span></div>
                  <div className="mt-1 font-semibold">{p.title}</div>
                </div>
                <ConfirmAction action={deletePlatformNews.bind(null, p.id)} label="Delete" confirm="Delete this announcement?"><Trash2 className="size-4" /></ConfirmAction>
              </CardBody>
            </Card>
          ))}
        </div>
        <Card className="self-start">
          <CardHeader title="New announcement" />
          <CardBody>
            <ActionForm action={createPlatformNews} submitLabel="Publish" resetOnSuccess>
              <Field label="Title"><Input name="title" required /></Field>
              <Field label="Type">
                <Select name="tag" defaultValue="Update"><option>Update</option><option>Announcement</option><option>Tip</option><option>Event</option></Select>
              </Field>
              <Field label="Message"><Textarea name="body" rows={6} required /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" className="size-4" /> Pin</label>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
