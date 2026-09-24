import type { Metadata } from "next";
import { Pin, PinOff, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { Markdown } from "@/components/markdown";
import { createNews, deleteNews, togglePin } from "../_actions/content";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Announcements" };

export default async function AdminNews() {
  const staff = await requireStaff();
  const posts = await db.newsPost.findMany({ where: { centerId: staff.centerId }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], include: { author: { select: { name: true } } } });
  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" subtitle="Posts appear in your students' What's New feed and on their dashboard." />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {posts.map((p) => (
            <Card key={p.id}>
              <CardBody>
                <div className="flex flex-wrap items-center gap-2">
                  {p.pinned && <Badge tone="brand"><Pin className="size-3" /> Pinned</Badge>}
                  <Badge>{p.tag}</Badge>
                  <span className="text-xs text-muted">{formatDate(p.createdAt)} · {p.author?.name}</span>
                  <div className="ml-auto flex items-center">
                    <form action={togglePin.bind(null, p.id)}>
                      <button className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label={p.pinned ? "Unpin" : "Pin"}>{p.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}</button>
                    </form>
                    <ConfirmAction action={deleteNews.bind(null, p.id)} label="Delete" confirm="Delete this announcement?"><Trash2 className="size-4" /></ConfirmAction>
                  </div>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold">{p.title}</h3>
                <Markdown className="mt-1 text-sm">{p.body}</Markdown>
              </CardBody>
            </Card>
          ))}
          {posts.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted">No announcements yet.</p>}
        </div>
        <Card className="self-start">
          <CardHeader title="New announcement" />
          <CardBody>
            <ActionForm action={createNews} submitLabel="Publish" resetOnSuccess>
              <Field label="Title"><Input name="title" required /></Field>
              <Field label="Type">
                <Select name="tag" defaultValue="Announcement">
                  <option>Announcement</option>
                  <option>Event</option>
                  <option>Update</option>
                  <option>Tip</option>
                </Select>
              </Field>
              <Field label="Message" hint="Markdown supported (**bold**, lists, links)"><Textarea name="body" rows={6} required /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" className="size-4 accent-[var(--brand)]" /> Pin to the top</label>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
