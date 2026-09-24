import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Lock, Trash2, Unlock, UserMinus } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
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

export const metadata: Metadata = { title: "Group" };

export default async function GroupPage({ params }: PageProps<"/admin/groups/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const group = await db.group.findFirst({ where: { id, centerId: staff.centerId }, include: { unlocks: true } });
  if (!group) notFound();
  const own = await db.roadmapUnit.count({ where: { centerId: staff.centerId } });
  const [members, others, units, branches, teachers, progress] = await Promise.all([
    centerStudents(staff.centerId, { groupId: group.id }),
    db.user.findMany({ where: { centerId: staff.centerId, role: "STUDENT", NOT: { groupId: group.id } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.roadmapUnit.findMany({ where: { centerId: own ? staff.centerId : null }, orderBy: { order: "asc" } }),
    db.branch.findMany({ where: { centerId: staff.centerId }, orderBy: { name: "asc" } }),
    db.user.findMany({ where: { centerId: staff.centerId, role: { in: ["TEACHER", "CENTER_ADMIN"] } }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.unitProgress.groupBy({ by: ["unitId"], where: { user: { groupId: group.id }, completedAt: { not: null } }, _count: true }),
  ]);
  const unlocked = new Set(group.unlocks.map((u) => u.unitId));
  const doneBy = new Map(progress.map((p) => [p.unitId, p._count]));

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/admin/groups" className="hover:text-ink">Groups</Link>
        <ChevronRight className="size-3.5" />
        <span>{group.name}</span>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{group.name}</h1>
          <p className="text-muted">{group.schedule}</p>
        </div>
        {staff.role === "CENTER_ADMIN" && (
          <ConfirmAction action={deleteGroup.bind(null, group.id)} label="Delete group" confirm="Delete this group? Students stay in your center but lose their group.">
            <Trash2 className="size-4" /> Delete group
          </ConfirmAction>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Students" value={members.length} />
        <StatTile label="Average latest score" value={average(members.map((m) => m.latestScore)) ?? "—"} />
        <StatTile label="Average accuracy" value={`${average(members.map((m) => m.accuracy)) ?? 0}%`} />
        <StatTile label="Active this week" value={`${members.filter((m) => m.weekQuestions > 0).length}/${members.length}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader title="Members" />
          <CardBody className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="py-2 pr-3 font-semibold">Student</th>
                  <th className="py-2 pr-3 text-right font-semibold">Latest</th>
                  <th className="py-2 pr-3 text-right font-semibold">Accuracy</th>
                  <th className="py-2 pr-3 text-right font-semibold">This week</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="py-2 pr-3">
                      <Link href={`/admin/students/${m.id}`} className="flex items-center gap-2.5 font-semibold hover:text-brand">
                        <Avatar name={m.name} size={28} /> {m.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-right font-bold tabular-nums">{m.latestScore ?? "—"}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.accuracy === null ? "—" : `${m.accuracy}%`}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{m.weekQuestions}</td>
                    <td className="py-2 text-right">
                      <ConfirmAction action={removeFromGroup.bind(null, group.id, m.id)} label="Remove from group" confirm={`Remove ${m.name} from ${group.name}?`}>
                        <UserMinus className="size-4" />
                      </ConfirmAction>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted">No students in this group yet.</td></tr>}
              </tbody>
            </table>
            {others.length > 0 && (
              <ActionForm action={addToGroup.bind(null, group.id)} submitLabel="Add to group" submitVariant="secondary" className="mt-5 flex flex-wrap items-end gap-3 space-y-0 border-t border-line pt-4" submitClassName="h-11">
                <Field label="Add a student" className="min-w-56 flex-1">
                  <Select name="studentId" defaultValue="">
                    <option value="" disabled>Choose a student…</option>
                    {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </Select>
                </Field>
              </ActionForm>
            )}
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title="Group details" />
          <CardBody>
            <ActionForm action={updateGroup.bind(null, group.id)}>
              <GroupFields branches={branches} teachers={teachers} defaults={group} />
            </ActionForm>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Roadmap access" subtitle="Units unlock one by one as students pass quizzes. Unlock a unit here to open it for the whole group now." />
        <CardBody>
          <ol className="grid gap-2 md:grid-cols-2">
            {units.map((u, i) => {
              const open = i === 0 || unlocked.has(u.id);
              return (
                <li key={u.id} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2.5", open ? "border-brand/30 bg-brand-soft" : "border-line")}>
                  <span className="w-5 text-xs font-bold text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{u.title}</span>
                    <span className="text-xs text-muted">{doneBy.get(u.id) ?? 0}/{members.length} completed</span>
                  </span>
                  {i === 0 ? (
                    <Badge tone="success">Always open</Badge>
                  ) : (
                    <form action={toggleUnlock.bind(null, group.id, u.id)}>
                      <SubmitButton size="sm" variant={unlocked.has(u.id) ? "outline" : "secondary"} pendingText="…">
                        {unlocked.has(u.id) ? <><Lock className="size-3.5" /> Lock</> : <><Unlock className="size-3.5" /> Unlock</>}
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
