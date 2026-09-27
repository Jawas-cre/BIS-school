import { ClipboardList, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { visibleTo } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/misc";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { createAssignment, deleteAssignment } from "../../_actions/assignments";
import { AssignmentFields } from "./assignment-fields";
import { assignmentProgress, assignmentState, type AssignmentKind } from "@/lib/assignments";
import { addDays, dayKey, pct } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

/** The group's assignments: set new work and see who has done it. Shown in both staff panels. */
export async function AssignmentsCard({
  group,
  members,
  units,
}: {
  group: { id: string; centerId: string; subjectId: string | null };
  members: { id: string; name: string }[];
  units: { id: string; title: string }[];
}) {
  const { t, date } = await getI18n();
  const A = t.assignments;
  const [assignments, tests, topics] = await Promise.all([
    db.assignment.findMany({ where: { groupId: group.id }, orderBy: [{ dueOn: "desc" }, { createdAt: "desc" }], take: 20 }),
    db.test.findMany({
      where: { ...visibleTo(group.centerId), ...(group.subjectId ? { OR: [{ subjectId: group.subjectId }, { subjectId: null }] } : {}) },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    group.subjectId ? db.topic.findMany({ where: { subjectId: group.subjectId }, orderBy: { order: "asc" }, select: { id: true, name: true } }) : [],
  ]);
  const progress = await assignmentProgress(assignments, members.map((m) => m.id));

  return (
    <Card id="assignments">
      <CardHeader title={A.title} subtitle={A.subtitle} action={<ClipboardList className="size-4 text-muted" />} />
      <CardBody className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-3">
          {assignments.length === 0 && <p className="text-sm text-muted">{A.none}</p>}
          {assignments.map((a) => {
            const perUser = progress.get(a.id)!;
            const done = members.filter((m) => perUser.get(m.id)?.done).length;
            const overdue = a.dueOn < dayKey();
            return (
              <details key={a.id} className="group rounded-xl border border-line">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2.5">
                  <Badge tone="brand">{A.kind[a.kind as AssignmentKind]}</Badge>
                  <span className="min-w-0 flex-1 truncate font-semibold">{a.title}</span>
                  <span className={cn("text-xs", overdue ? "font-semibold text-danger" : "text-muted")}>{fmt(A.due, { date: date(a.dueOn, { year: undefined }) })}</span>
                  <span className="w-24">
                    <span className="block text-right text-xs font-semibold tabular-nums">{fmt(A.doneOf, { done, total: members.length })}</span>
                    <Progress value={pct(done, members.length)} className="mt-1" />
                  </span>
                </summary>
                <div className="border-t border-line px-3 py-2.5">
                  {a.note && <p className="mb-2 text-sm text-ink-2">{a.note}</p>}
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {members.map((m) => {
                      const p = perUser.get(m.id)!;
                      const state = assignmentState(a.dueOn, p.done);
                      return (
                        <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm hover:bg-surface-2">
                          <span className="truncate">{m.name}</span>
                          <span className={cn("shrink-0 text-xs font-semibold", state === "done" ? "text-success" : state === "overdue" ? "text-danger" : "text-muted")}>
                            {state === "done"
                              ? p.score !== null
                                ? fmt(A.doneScore, { score: p.score })
                                : A.state.done
                              : a.kind === "PRACTICE"
                                ? fmt(A.answeredOf, { n: p.answered, total: a.questions ?? 0 })
                                : A.state[state]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-2 flex justify-end">
                    <ConfirmAction action={deleteAssignment.bind(null, group.id, a.id)} label={A.delete} confirm={fmt(A.deleteConfirm, { title: a.title })}>
                      <Trash2 className="size-4" />
                    </ConfirmAction>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
        <div className="rounded-xl border border-line p-4">
          <h3 className="mb-3 font-display font-bold">{A.newTitle}</h3>
          {tests.length + units.length + topics.length === 0 ? (
            <p className="text-sm text-muted">{A.nothingToAssign}</p>
          ) : (
            <ActionForm action={createAssignment.bind(null, group.id)} submitLabel={A.assign} resetOnSuccess>
              <AssignmentFields
                tests={tests.map((x) => ({ id: x.id, name: x.title }))}
                units={units.map((x) => ({ id: x.id, name: x.title }))}
                topics={topics}
                today={dayKey()}
                defaultDue={addDays(dayKey(), 7)}
              />
            </ActionForm>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
