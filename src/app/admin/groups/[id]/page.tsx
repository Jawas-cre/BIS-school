import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lock, Trash2, Unlock, UserMinus } from "lucide-react";
import { db } from "@/lib/db";
import { panelBase, requireStaff, staffGroups } from "@/lib/auth";
import { average, centerStudents } from "@/lib/admin";
import { Avatar, StatTile } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Select } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { addToGroup, deleteGroup, removeFromGroup, toggleUnlock, updateGroup } from "../../_actions/people";
import { GroupFields } from "../group-fields";
import { cn } from "@/lib/utils";
import { visibleSubjects } from "@/lib/subjects";
import { SubjectBadge } from "@/components/subject-icon";
import { fmt } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.adminGroups.groupTitle);

export default async function GroupPage({ params }: PageProps<"/admin/groups/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const t = await getT();
  const G = t.adminGroups;
  // A teacher opens only the groups they teach, and manages members and roadmap access; admins also edit the details.
  const admin = staff.role === "CENTER_ADMIN";
  const base = panelBase(staff.role);
  const group = await db.group.findFirst({ where: { id, ...staffGroups(staff) }, include: { unlocks: true, subject: true, branch: true, teacher: { select: { name: true } } } });
  if (!group) notFound();
  const own = group.subjectId ? await db.roadmapUnit.count({ where: { centerId: staff.centerId, subjectId: group.subjectId } }) : 0;
  const [members, others, units, branches, teachers, progress, subjects] = await Promise.all([
    centerStudents(staff.centerId, { groupId: group.id }),
    db.user.findMany({ where: { centerId: staff.centerId, role: "STUDENT", memberships: { none: { groupId: group.id } } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    group.subjectId ? db.roadmapUnit.findMany({ where: { subjectId: group.subjectId, centerId: own ? staff.centerId : null }, orderBy: { order: "asc" } }) : [],
    db.branch.findMany({ where: { centerId: staff.centerId }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { centerId: staff.centerId, role: { in: ["TEACHER", "CENTER_ADMIN"] } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.unitProgress.groupBy({ by: ["unitId"], where: { user: { memberships: { some: { groupId: group.id } } }, completedAt: { not: null } }, _count: true }),
    visibleSubjects(staff.centerId),
  ]);
  const unlocked = new Set(group.unlocks.map((u) => u.unitId));
  const doneBy = new Map(progress.map((p) => [p.unitId, p._count]));

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href={`${base}/groups`} className="hover:text-ink">{admin ? t.nav.groups : t.nav.myGroups}</Link>
        <ChevronRight className="size-3.5" />
        <span>{group.name}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{group.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-muted">
            {group.subject && <SubjectBadge name={group.subject.name} color={group.subject.color} />}
            {group.schedule}
          </div>
        </div>
        {admin && (
          <ConfirmAction action={deleteGroup.bind(null, group.id)} label={G.deleteLabel} confirm={G.deleteConfirm}>
            <Trash2 className="size-4" /> {G.deleteLabel}
          </ConfirmAction>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label={t.overview.statStudents} value={members.length} />
        <StatTile label={t.overview.avgTestScore} value={average(members.map((m) => m.avgTest)) !== null ? `${average(members.map((m) => m.avgTest))}%` : "—"} />
        <StatTile label={t.overview.avgAccuracy} value={`${average(members.map((m) => m.accuracy)) ?? 0}%`} />
        <StatTile label={t.overview.activeWeek} value={`${members.filter((m) => m.weekQuestions > 0).length}/${members.length}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title={G.members} />
          <CardBody className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-semibold">{G.colStudent}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{G.colAvgTest}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{G.colAccuracy}</th>
                  <th className="py-2 pr-3 text-right font-semibold">{G.colWeek}</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="py-2 pr-3">
                      <Link href={`${base}/students/${m.id}`} className="flex items-center gap-2.5 font-semibold hover:text-brand">
                        <Avatar name={m.name} size={28} /> {m.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-right font-bold tabular-nums">{m.avgTest !== null ? `${m.avgTest}%` : "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.accuracy === null ? "—" : `${m.accuracy}%`}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.weekQuestions}</td>
                    <td className="py-2 text-right">
                      <ConfirmAction action={removeFromGroup.bind(null, group.id, m.id)} label={G.removeFromGroup} confirm={fmt(G.removeConfirm, { name: m.name, group: group.name })}>
                        <UserMinus className="size-4" />
                      </ConfirmAction>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted">{G.noMembers}</td></tr>}
              </tbody>
            </table>
            {others.length > 0 && (
              <ActionForm action={addToGroup.bind(null, group.id)} submitLabel={G.addToGroup} submitVariant="secondary" className="mt-5 flex flex-wrap items-end gap-3 space-y-0 border-t border-line pt-4" submitClassName="h-11">
                <Field label={G.addStudent} className="min-w-56 flex-1">
                  <Select name="studentId" defaultValue="">
                    <option value="" disabled>{G.chooseStudent}</option>
                    {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </Select>
                </Field>
              </ActionForm>
            )}
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title={G.details} />
          <CardBody>
            {admin ? (
              <ActionForm action={updateGroup.bind(null, group.id)}>
                <GroupFields
                  branches={branches}
                  teachers={teachers}
                  subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
                  defaults={{ name: group.name, subjectId: group.subjectId, branchId: group.branchId, teacherId: group.teacherId, schedule: group.schedule }}
                />
              </ActionForm>
            ) : (
              <dl className="space-y-3 text-sm">
                {[
                  [G.subject, group.subject?.name],
                  [G.branch, group.branch?.name],
                  [G.teacherLabel, group.teacher?.name],
                  [G.schedule, group.schedule],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3 border-b border-line pb-2 last:border-0 last:pb-0">
                    <dt className="text-muted">{label}</dt>
                    <dd className="text-right font-semibold">{value || "—"}</dd>
                  </div>
                ))}
                <p className="pt-1 text-xs text-muted">{t.teacher.detailsByAdmin}</p>
              </dl>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title={G.roadmapAccess} subtitle={group.subject ? fmt(G.roadmapAccessSub, { subject: group.subject.name }) : G.chooseSubjectFirst} />
        <CardBody>
          <ol className="grid gap-2 md:grid-cols-2">
            {units.map((u, i) => {
              const open = i === 0 || unlocked.has(u.id);
              return (
                <li key={u.id} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5", open ? "border-brand/30 bg-brand-soft" : "border-line")}>
                  <span className="w-5 text-xs font-bold text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{u.title}</span>
                    <span className="text-xs text-muted">{fmt(G.completedOf, { done: doneBy.get(u.id) ?? 0, total: members.length })}</span>
                  </span>
                  {i === 0 ? (
                    <Badge tone="success">{G.alwaysOpen}</Badge>
                  ) : (
                    <form action={toggleUnlock.bind(null, group.id, u.id)}>
                      <SubmitButton size="sm" variant={unlocked.has(u.id) ? "outline" : "secondary"} pendingText="…">
                        {unlocked.has(u.id) ? <><Lock className="size-3.5" /> {G.lock}</> : <><Unlock className="size-3.5" /> {G.unlock}</>}
                      </SubmitButton>
                    </form>
                  )}
                </li>
              );
            })}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
