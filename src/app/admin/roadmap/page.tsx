import type { Metadata } from "next";
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

export const metadata: Metadata = { title: "Roadmap" };

export default async function AdminRoadmap({ searchParams }: PageProps<"/admin/roadmap">) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const subjects = await visibleSubjects(staff.centerId);
  const subject = subjects.find((s) => s.id === sp.subject) ?? subjects[0];
  if (!subject) return <EmptyState title="No subjects yet">Add a subject first.</EmptyState>;

  const own = await db.roadmapUnit.findMany({ where: { centerId: staff.centerId, subjectId: subject.id }, orderBy: { order: "asc" }, include: { topic: true } });
  const ownSubject = subject.centerId === staff.centerId;
  const custom = own.length > 0 || ownSubject;
  const units = custom ? own : await db.roadmapUnit.findMany({ where: { centerId: null, subjectId: subject.id }, orderBy: { order: "asc" }, include: { topic: true } });

  return (
    <div className="space-y-6">
      <PageHeader title="Roadmap" subtitle="Each subject has a step-by-step roadmap of lessons. Use the platform roadmap as it is, or customize it with your own units and video lessons." />

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
          <p className="text-sm text-muted">{custom ? (ownSubject ? "Your center's subject." : "Customized for your center.") : "Using the platform roadmap."} {units.length} units.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {custom ? (
            <>
              <ButtonLink href={`/admin/roadmap/new?subject=${subject.id}`}><Plus className="size-4" /> Add unit</ButtonLink>
              {!ownSubject && (
                <ConfirmAction action={resetRoadmap.bind(null, subject.id)} label="Reset to platform roadmap" confirm="Delete your custom units for this subject and go back to the platform roadmap? Student progress on custom units will be lost." className="h-10 rounded-xl border border-line-strong px-3">
                  Reset to default
                </ConfirmAction>
              )}
            </>
          ) : (
            <form action={customizeRoadmap.bind(null, subject.id)}>
              <SubmitButton pendingText="Copying…">Customize this roadmap</SubmitButton>
            </form>
          )}
        </div>
      </div>
      {!custom && (
        <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
          Customizing copies the {units.length} platform units into an editable roadmap for your center. Students&apos; progress restarts on the copied units.
        </p>
      )}
      <Card>
        <CardBody className="p-0">
          {units.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">No units yet — add the first one.</p>}
          <ol className="divide-y divide-line">
            {units.map((u, i) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span className="w-6 text-sm font-bold text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{u.title}</span>
                    {u.topic && <Badge>Quiz: {u.topic.name}</Badge>}
                    {u.videoUrl && <PlayCircle className="size-4 text-success" aria-label="Has video" />}
                  </div>
                  <div className="truncate text-sm text-muted">{u.summary}</div>
                </div>
                {custom && (
                  <div className="flex items-center">
                    <form action={moveUnit.bind(null, u.id, -1)}><button disabled={i === 0} className="rounded-lg p-2 text-muted hover:bg-surface-2 disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-4" /></button></form>
                    <form action={moveUnit.bind(null, u.id, 1)}><button disabled={i === units.length - 1} className="rounded-lg p-2 text-muted hover:bg-surface-2 disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-4" /></button></form>
                    <Link href={`/admin/roadmap/${u.id}`} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Edit"><Pencil className="size-4" /></Link>
                    <ConfirmAction action={deleteUnit.bind(null, u.id)} label="Delete unit" confirm={`Delete “${u.title}”?`}><Trash2 className="size-4" /></ConfirmAction>
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
