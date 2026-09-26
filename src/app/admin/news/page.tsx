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
import { newsTag } from "@/lib/i18n/labels";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.announcements);

export default async function AdminNews() {
  const staff = await requireStaff();
  const { t, date } = await getI18n();
  const N = t.adminNews;
  const posts = await db.newsPost.findMany({ where: { centerId: staff.centerId }, orderBy: [{ pinned: "desc" }, { createdAt: "desc" }], include: { author: { select: { name: true } } } });
  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.announcements} subtitle={N.subtitle} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {posts.map((p) => (
            <Card key={p.id}>
              <CardBody>
                <div className="flex flex-wrap items-center gap-2">
                  {p.pinned && <Badge tone="brand"><Pin className="size-3" /> {t.news.pinned}</Badge>}
                  <Badge>{newsTag(t, p.tag)}</Badge>
                  <span className="text-xs text-muted">{date(p.createdAt)} · {p.author?.name}</span>
                  <div className="ml-auto flex items-center">
                    <form action={togglePin.bind(null, p.id)}>
                      <button className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label={p.pinned ? N.unpin : N.pin}>{p.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}</button>
                    </form>
                    <ConfirmAction action={deleteNews.bind(null, p.id)} label={t.common.delete} confirm={N.deleteConfirm}><Trash2 className="size-4" /></ConfirmAction>
                  </div>
                </div>
                <h3 className="mt-2 font-display text-lg font-bold">{p.title}</h3>
                <Markdown className="mt-1 text-sm">{p.body}</Markdown>
              </CardBody>
            </Card>
          ))}
          {posts.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted">{N.empty}</p>}
        </div>
        <Card className="self-start">
          <CardHeader title={N.newTitle} />
          <CardBody>
            <ActionForm action={createNews} submitLabel={N.publish} resetOnSuccess>
              <Field label={N.title}><Input name="title" required /></Field>
              <Field label={N.type}>
                <Select name="tag" defaultValue="Announcement">
                  {(["Announcement", "Event", "Update", "Tip"] as const).map((tag) => (
                    <option key={tag} value={tag}>{t.news.tags[tag]}</option>
                  ))}
                </Select>
              </Field>
              <Field label={N.message} hint={N.messageHint}><Textarea name="body" rows={6} required /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" className="size-4 accent-[var(--brand)]" /> {N.pinTop}</label>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
