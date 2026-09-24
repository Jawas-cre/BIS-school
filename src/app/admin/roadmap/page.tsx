import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, PlayCircle, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { visibleSubjects } from "@/lib/subjects";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmAction } from "@/components/action-form";
import { SubjectIcon } from "@/components/subject-icon";
import { customizeRoadmap, deleteUnit, moveUnit, resetRoadmap } from "../_actions/content";
import { cn } from "@/lib/utils";
import { fmt, plural } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.roadmap);

export default async function AdminRoadmap({ searchParams }: PageProps<"/admin/roadmap">) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const t = await getT();
  const R = t.adminRoadmap;
  const subjects = await visibleSubjects(staff.centerId);
  const subject = subjects.find((s) => s.id === sp.subject) ?? subjects[0];
  if (!subject) return <EmptyState title={R.noSubjects}>{R.addSubjectFirst}</EmptyState>;

  const own = await db.roadmapUnit.findMany({ where: { centerId: staff.centerId, subjectId: subject.id }, orderBy: { order: "asc" }, include: { topic: true } });
  const ownSubject = subject.centerId === staff.centerId;
  const custom = own.length > 0 || ownSubject;
  const units = custom ? own : await db.roadmapUnit.findMany({ where: { centerId: null, subjectId: subject.id }, orderBy: { order: "asc" }, include: { topic: true } });

  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.roadmap} subtitle={R.subtitle} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {subjects.map((s) => (
          <Link key={s.id} href={`/admin/roadmap?subject=${s.id}`} className={cn("flex shrink-0 items-center gap-2 rounded-2xl border bg-surface py-1.5 pr-4 pl-1.5 text-sm font-semibold shadow-card", s.id === subject.id ? "border-brand ring-4 ring-brand-soft" : "border-line hover:border-line-strong")}>
            <SubjectIcon icon={s.icon} color={s.color} size={28} /> {s.name}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold">{subject.name}</h2>
          <p className="text-sm text-muted">{custom ? (ownSubject ? R.ownSubject : R.customized) : R.usingPlatform} {plural(t.common.units, units.length)}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {custom ? (
            <>
              <ButtonLink href={`/admin/roadmap/new?subject=${subject.id}`}><Plus className="size-4" /> {R.addUnit}</ButtonLink>
              {!ownSubject && (
                <ConfirmAction action={resetRoadmap.bind(null, subject.id)} label={R.resetLabel} confirm={R.resetConfirm} className="h-10 rounded-xl border border-line-strong px-3">
                  {R.resetDefault}
                </ConfirmAction>
              )}
            </>
          ) : (
            <form action={customizeRoadmap.bind(null, subject.id)}>
              <SubmitButton pendingText={R.copying}>{R.customize}</SubmitButton>
            </form>
          )}
        </div>
      </div>
      {!custom && (
        <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
          {fmt(R.customizeNote, { n: units.length })}
        </p>
      )}
      <Card>
        <CardBody className="p-0">
          {units.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">{R.noUnits}</p>}
          <ol className="divide-y divide-line">
            {units.map((u, i) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span className="w-6 text-sm font-bold text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{u.title}</span>
                    {u.topic && <Badge>{fmt(R.quiz, { topic: u.topic.name })}</Badge>}
                    {u.videoUrl && <PlayCircle className="size-4 text-success" aria-label={t.roadmap.hasVideo} />}
                  </div>
                  <div className="truncate text-sm text-muted">{u.summary}</div>
                </div>
                {custom && (
                  <div className="flex items-center">
                    <form action={moveUnit.bind(null, u.id, -1)}><button disabled={i === 0} className="rounded-lg p-2 text-muted hover:bg-surface-2 disabled:opacity-30" aria-label={R.moveUp}><ArrowUp className="size-4" /></button></form>
                    <form action={moveUnit.bind(null, u.id, 1)}><button disabled={i === units.length - 1} className="rounded-lg p-2 text-muted hover:bg-surface-2 disabled:opacity-30" aria-label={R.moveDown}><ArrowDown className="size-4" /></button></form>
                    <Link href={`/admin/roadmap/${u.id}`} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label={t.common.edit}><Pencil className="size-4" /></Link>
                    <ConfirmAction action={deleteUnit.bind(null, u.id)} label={R.deleteUnit} confirm={fmt(R.deleteConfirm, { title: u.title })}><Trash2 className="size-4" /></ConfirmAction>
                  </div>
                )}
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
