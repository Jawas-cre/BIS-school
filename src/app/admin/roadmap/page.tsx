import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDown, ArrowUp, Pencil, PlayCircle, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ConfirmAction } from "@/components/action-form";
import { customizeRoadmap, deleteUnit, moveUnit, resetRoadmap } from "../_actions/content";

export const metadata: Metadata = { title: "Roadmap" };

export default async function AdminRoadmap() {
  const staff = await requireStaff();
  const own = await db.roadmapUnit.findMany({ where: { centerId: staff.centerId }, orderBy: { order: "asc" } });
  const custom = own.length > 0;
  const units = custom ? own : await db.roadmapUnit.findMany({ where: { centerId: null }, orderBy: { order: "asc" } });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roadmap"
        subtitle={custom ? "Your center's custom roadmap. Add video lessons, rewrite notes and reorder units." : "Your students follow the platform roadmap. Customize it to add your own video lessons and units."}
        action={
          custom ? (
            <>
              <ButtonLink href="/admin/roadmap/new"><Plus className="size-4" /> Add unit</ButtonLink>
              <ConfirmAction action={resetRoadmap} label="Reset to platform roadmap" confirm="Delete your custom roadmap and go back to the platform default? Student progress on custom units will be lost." className="h-10 rounded-xl border border-line-strong px-3">
                Reset to default
              </ConfirmAction>
            </>
          ) : (
            <form action={customizeRoadmap}>
              <SubmitButton pendingText="Copying…">Customize roadmap</SubmitButton>
            </form>
          )
        }
      />
      {!custom && (
        <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
          Customizing copies the {units.length} platform units into an editable roadmap for your center. Students&apos; progress restarts on the copied units.
        </p>
      )}
      <Card>
        <CardBody className="p-0">
          <ol className="divide-y divide-line">
            {units.map((u, i) => (
              <li key={u.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <span className="w-6 text-sm font-bold text-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{u.title}</span>
                    <Badge tone={u.section === "MATH" ? "warning" : "brand"}>{u.section === "MATH" ? "Math" : "R&W"}</Badge>
                    {u.skill && <Badge>Quiz: {u.skill}</Badge>}
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
