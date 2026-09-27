import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { ownerCenter, SITE_KINDS, type SiteKind } from "@/lib/site";
import { PageHeader, Avatar } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { ButtonLink } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { SiteItemFields } from "./site-item-fields";
import { deleteSiteItem, moveSiteItem, saveSiteItem, saveTeacherBios, updateSite } from "../_actions/website";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";
import type { Dict } from "@/lib/i18n/dictionaries";

export const generateMetadata = pageTitle((t) => t.nav.website);

export default async function WebsitePage() {
  const admin = await requireCenterAdmin();
  const t = await getT();
  const W = t.siteAdmin;
  const center = admin.center!;
  const [items, teachers, branches, own] = await Promise.all([
    db.siteItem.findMany({ where: { centerId: center.id }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
    db.user.findMany({ where: { centerId: center.id, role: "TEACHER" }, orderBy: { name: "asc" }, select: { id: true, name: true, bio: true, onSite: true } }),
    db.branch.count({ where: { centerId: center.id } }),
    ownerCenter(),
  ]);
  const path = `/c/${center.slug}`;
  const isHomePage = own?.id === center.id;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.nav.website}
        subtitle={W.subtitle}
        action={
          <ButtonLink href={path} target="_blank" rel="noreferrer" variant="outline">
            <ExternalLink className="size-4" /> {W.open}
          </ButtonLink>
        }
      />

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{W.addressTitle}</div>
            <div className="mt-0.5 text-sm text-muted">{isHomePage ? W.addressHome : W.addressOnly}</div>
          </div>
          <code className="rounded-xl border border-line bg-surface-2 px-3 py-2 font-mono text-sm font-semibold break-all">{isHomePage ? "/" : path}</code>
          <CopyButton text={isHomePage ? "/" : path} absolute label={W.copyLink} />
        </CardBody>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="self-start">
          <CardHeader title={W.heroTitle} subtitle={W.heroSubtitle} />
          <CardBody>
            <ActionForm action={updateSite}>
              <Field label={W.headline} hint={W.headlineHint}>
                <Input name="heroTitle" defaultValue={center.heroTitle ?? ""} placeholder={fmt(t.site.defaultHeadline, { name: center.name })} maxLength={120} />
              </Field>
              <Field label={W.intro} hint={W.introHint}>
                <Textarea name="heroText" defaultValue={center.heroText ?? ""} placeholder={center.about || t.site.defaultIntro} rows={3} maxLength={600} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={W.phone} className="sm:col-span-2"><Input name="phone" type="tel" defaultValue={center.phone ?? ""} placeholder="+998 71 200 00 00" maxLength={30} /></Field>
                <Field label="Telegram"><Input name="telegram" defaultValue={center.telegram ?? ""} placeholder="@yourcenter" maxLength={120} /></Field>
                <Field label="Instagram"><Input name="instagram" defaultValue={center.instagram ?? ""} placeholder="@yourcenter" maxLength={120} /></Field>
              </div>
              <p className="flex items-start gap-2 text-xs text-muted">
                <MapPin className="mt-px size-3.5 shrink-0" />
                <span>
                  {branches ? W.branchesNote : W.noBranchesNote}{" "}
                  <Link href="/admin/settings" className="font-semibold text-brand hover:underline">{t.nav.settings}</Link>
                </span>
              </p>
            </ActionForm>
          </CardBody>
        </Card>

        <Card className="self-start">
          <CardHeader title={W.teachersTitle} subtitle={W.teachersSubtitle} />
          <CardBody>
            {teachers.length ? (
              <ActionForm action={saveTeacherBios}>
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="space-y-1.5" data-teacher={teacher.name}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <Avatar name={teacher.name} size={24} /> {teacher.name}
                      </span>
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                        <input type="checkbox" name={`show_${teacher.id}`} defaultChecked={teacher.onSite} className="size-4 accent-[var(--brand)]" />
                        {W.showTeacher}
                      </label>
                    </div>
                    <Textarea
                      name={`bio_${teacher.id}`}
                      aria-label={fmt(W.bioLabel, { name: teacher.name })}
                      defaultValue={teacher.bio ?? ""}
                      placeholder={W.bioPlaceholder}
                      rows={2}
                      maxLength={300}
                      className="min-h-0"
                    />
                  </div>
                ))}
              </ActionForm>
            ) : (
              <p className="text-sm text-muted">
                {W.noTeachers} <Link href="/admin/staff" className="font-semibold text-brand hover:underline">{t.nav.staff}</Link>
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Courses have the most fields, so they get the full width; results and questions share a row. */}
      <div className="grid gap-6 xl:grid-cols-2">
        {SITE_KINDS.map((kind) => (
          <ItemsCard key={kind} kind={kind} items={items.filter((i) => i.kind === kind)} W={W} t={t} className={kind === "COURSE" ? "xl:col-span-2" : undefined} />
        ))}
      </div>
    </div>
  );
}

function ItemsCard({
  kind,
  items,
  W,
  t,
  className,
}: {
  className?: string;
  kind: SiteKind;
  items: { id: string; title: string; subtitle: string | null; meta: string | null; body: string | null }[];
  W: Dict["siteAdmin"];
  t: Dict;
}) {
  const L = W.lists[kind];
  const iconButton = "grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink disabled:pointer-events-none disabled:opacity-30";
  return (
    <Card className={cn("self-start", className)} data-site-kind={kind}>
      <CardHeader title={L.title} subtitle={L.subtitle} />
      <CardBody className="space-y-4">
        {items.length > 0 ? (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {items.map((item, i) => (
              <li key={item.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold break-words">{item.title}</div>
                    {(item.subtitle || item.meta) && <div className="text-xs text-muted">{[item.subtitle, item.meta].filter(Boolean).join(" · ")}</div>}
                    {item.body && <p className="mt-1 line-clamp-2 text-sm text-muted">{item.body}</p>}
                  </div>
                  <div className="flex shrink-0 items-center">
                    <form action={moveSiteItem.bind(null, item.id, -1)}>
                      <button className={iconButton} disabled={i === 0} aria-label={W.moveUp} title={W.moveUp}><ArrowUp className="size-4" /></button>
                    </form>
                    <form action={moveSiteItem.bind(null, item.id, 1)}>
                      <button className={iconButton} disabled={i === items.length - 1} aria-label={W.moveDown} title={W.moveDown}><ArrowDown className="size-4" /></button>
                    </form>
                    <ConfirmAction action={deleteSiteItem.bind(null, item.id)} label={t.common.delete} confirm={fmt(W.deleteConfirm, { title: item.title })}>
                      <Trash2 className="size-4" />
                    </ConfirmAction>
                  </div>
                </div>
                <details className="mt-1">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-brand">
                    <Pencil className="size-3.5" /> {t.common.edit}
                  </summary>
                  <ActionForm action={saveSiteItem.bind(null, kind, item.id)} className="mt-2" submitLabel={t.common.saveChanges} submitVariant="secondary">
                    <SiteItemFields kind={kind} item={item} W={W} />
                  </ActionForm>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted">{L.empty}</p>
        )}
        <details className="rounded-xl border border-line p-3">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-bold text-brand">
            <Plus className="size-4" /> {L.add}
          </summary>
          <ActionForm action={saveSiteItem.bind(null, kind, null)} className="mt-3" submitLabel={L.add} resetOnSuccess>
            <SiteItemFields kind={kind} W={W} />
          </ActionForm>
        </details>
      </CardBody>
    </Card>
  );
}
