import Link from "next/link";
import { Layers, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { GroupFields } from "./group-fields";
import { ActionForm } from "@/components/action-form";
import { createGroup } from "../_actions/people";
import { visibleSubjects } from "@/lib/subjects";
import { SubjectIcon } from "@/components/subject-icon";
import { rich } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.groups);

export default async function GroupsPage() {
  const staff = await requireStaff();
  const t = await getT();
  const G = t.adminGroups;
  const [groups, branches, teachers] = await Promise.all([
    db.group.findMany({
      where: { centerId: staff.centerId },
      orderBy: { name: "asc" },
      include: { teacher: { select: { name: true } }, branch: { select: { name: true } }, subject: true, _count: { select: { members: true } } },
    }),
    db.branch.findMany({ where: { centerId: staff.centerId }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { centerId: staff.centerId, role: { in: ["TEACHER", "CENTER_ADMIN"] } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const subjects = await visibleSubjects(staff.centerId);

  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.groups} subtitle={G.subtitle} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="grid content-start gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <Link key={g.id} href={`/admin/groups/${g.id}`} className="group rounded-2xl border border-line bg-surface p-5 shadow-card hover:border-line-strong">
              <div className="flex items-start justify-between">
                {g.subject ? <SubjectIcon icon={g.subject.icon} color={g.subject.color} /> : <div className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Layers className="size-5" /></div>}
                <span className="flex items-center gap-1 text-sm font-semibold text-ink-2"><Users className="size-4" /> {g._count.members}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold group-hover:text-brand">{g.name}</h3>
              <p className="mt-0.5 text-sm text-muted">{[g.subject?.name, g.branch?.name, g.schedule].filter(Boolean).join(" · ") || G.noSchedule}</p>
              <p className="mt-3 text-sm text-ink-2">{rich(G.teacher, { name: <strong>{g.teacher?.name ?? G.notAssigned}</strong> })}</p>
            </Link>
          ))}
          {groups.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted md:col-span-2">{G.empty}</p>}
        </div>
        <Card className="self-start">
          <CardHeader title={G.newGroup} />
          <CardBody>
            <ActionForm action={createGroup} submitLabel={G.createGroup}>
              <GroupFields branches={branches} teachers={teachers} subjects={subjects.map((s) => ({ id: s.id, name: s.name }))} />
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
