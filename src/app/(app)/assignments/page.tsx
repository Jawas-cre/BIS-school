import { requireStudentArea } from "@/lib/auth";
import { studentAssignments } from "@/lib/assignments";
import { AssignmentItem } from "@/components/assignment-item";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.assignments.myTitle);

export default async function AssignmentsPage() {
  const user = await requireStudentArea();
  const { t, date } = await getI18n();
  const A = t.assignments;
  const all = await studentAssignments(user.id, user.memberships.map((m) => m.groupId));
  // Overdue first, then by due day; done ones last, newest first.
  const todo = all.filter((a) => a.state !== "done").sort((x, y) => (x.state === y.state ? x.dueOn.localeCompare(y.dueOn) : x.state === "overdue" ? -1 : 1));
  const done = all.filter((a) => a.state === "done").reverse();
  return (
    <div className="space-y-6">
      <PageHeader title={A.myTitle} subtitle={A.mySubtitle} />
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold">{A.todo}</h2>
        {todo.length === 0 ? <EmptyState title={A.noneStudent} /> : todo.map((a) => <AssignmentItem key={a.id} a={a} t={t} date={date} />)}
      </section>
      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-bold">{A.doneTitle}</h2>
          {done.map((a) => <AssignmentItem key={a.id} a={a} t={t} date={date} />)}
        </section>
      )}
    </div>
  );
}
