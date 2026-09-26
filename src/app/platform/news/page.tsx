import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { createPlatformNews, deletePlatformNews } from "../actions";
import { newsTag } from "@/lib/i18n/labels";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.platform.newsTitle);

export default async function PlatformNews() {
  await requireSuperAdmin();
  const { t, date } = await getI18n();
  const P = t.platform;
  const N = t.adminNews;
  const posts = await db.newsPost.findMany({ where: { centerId: null }, orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <PageHeader title={P.newsTitle} subtitle={P.newsSub} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {posts.map((p) => (
            <Card key={p.id}>
              <CardBody className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><Badge>{newsTag(t, p.tag)}</Badge><span className="text-xs text-muted">{date(p.createdAt)}</span></div>
                  <div className="mt-1 font-semibold">{p.title}</div>
                </div>
                <ConfirmAction action={deletePlatformNews.bind(null, p.id)} label={t.common.delete} confirm={N.deleteConfirm}><Trash2 className="size-4" /></ConfirmAction>
              </CardBody>
            </Card>
          ))}
        </div>
        <Card className="self-start">
          <CardHeader title={N.newTitle} />
          <CardBody>
            <ActionForm action={createPlatformNews} submitLabel={N.publish} resetOnSuccess>
              <Field label={N.title}><Input name="title" required /></Field>
              <Field label={N.type}>
                <Select name="tag" defaultValue="Update">
                  {(["Update", "Announcement", "Tip", "Event"] as const).map((tag) => (
                    <option key={tag} value={tag}>{t.news.tags[tag]}</option>
                  ))}
                </Select>
              </Field>
              <Field label={N.message}><Textarea name="body" rows={6} required /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" className="size-4" /> {P.pin}</label>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
