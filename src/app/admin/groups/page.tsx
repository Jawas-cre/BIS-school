import type { Metadata } from "next";
import Link from "next/link";
import { Layers, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { GroupFields } from "./group-fields";
import { ActionForm } from "@/components/action-form";
import { createGroup } from "../_actions/people";

export const metadata: Metadata = { title: "Groups" };

export default async function GroupsPage() {
  const staff = await requireStaff();
  const [groups, branches, teachers] = await Promise.all([
    db.group.findMany({
      where: { centerId: staff.centerId },
      orderBy: { name: "asc" },
      include: { teacher: { select: { name: true } }, branch: { select: { name: true } }, _count: { select: { students: true } } },
    }),
    db.branch.findMany({ where: { centerId: staff.centerId }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { centerId: staff.centerId, role: { in: ["TEACHER", "CENTER_ADMIN"] } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Groups" subtitle="Classes with a teacher and schedule. Teachers can unlock roadmap units for a whole group." />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <Link key={g.id} href={`/admin/groups/${g.id}`} className="group rounded-2xl border border-line bg-surface p-5 shadow-card hover:border-line-strong">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Layers className="size-5" /></div>
                <span className="flex items-center gap-1 text-sm font-semibold text-ink-2"><Users className="size-4" /> {g._count.students}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold group-hover:text-brand">{g.name}</h3>
              <p className="mt-0.5 text-sm text-muted">{[g.branch?.name, g.schedule].filter(Boolean).join(" · ") || "No schedule set"}</p>
              <p className="mt-3 text-sm text-ink-2">Teacher: <strong>{g.teacher?.name ?? "not assigned"}</strong></p>
            </Link>
          ))}
          {groups.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted md:col-span-2">No groups yet. Create your first one →</p>}
        </div>
        <Card className="self-start">
          <CardHeader title="New group" />
          <CardBody>
            <ActionForm action={createGroup} submitLabel="Create group">
              <GroupFields branches={branches} teachers={teachers} />
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
