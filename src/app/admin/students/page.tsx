import Link from "next/link";
import { Search, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { panelBase, requireStaff, staffGroups } from "@/lib/auth";
import { centerStudents } from "@/lib/admin";
import { PageHeader, Avatar } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/form";
import { SubjectBadge } from "@/components/subject-icon";
import { ActionForm } from "@/components/action-form";
import { createStudent } from "../_actions/people";
import { cn } from "@/lib/utils";
import { fmt, plural } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.students);

export default async function StudentsPage({ searchParams }: PageProps<"/admin/students">) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const t = await getT();
  const S = t.adminStudents;
  // Teachers see the students of their own groups; only center admins add student accounts.
  const teacher = staff.role === "TEACHER";
  const base = panelBase(staff.role);
  const q = typeof sp.q === "string" ? sp.q.toLowerCase().slice(0, 60) : "";
  const groupId = typeof sp.group === "string" ? sp.group : "";
  const [all, groups] = await Promise.all([
    centerStudents(staff.centerId, { teacherId: teacher ? staff.id : undefined }),
    db.group.findMany({ where: staffGroups(staff), orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const students = all.filter(
    (s) => (!q || s.name.toLowerCase().includes(q) || s.email.includes(q)) && (!groupId || (groupId === "none" ? s.groups.length === 0 : s.groups.some((g) => g.id === groupId))),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={teacher ? t.nav.myStudents : t.nav.students}
        subtitle={teacher ? fmt(t.teacher.studentsSubtitle, { students: plural(t.common.students, all.length) }) : fmt(S.subtitle, { students: plural(t.common.students, all.length), center: staff.center?.name ?? "" })}
      />

      <div className={cn("grid gap-6", !teacher && "xl:grid-cols-[1fr_340px]")}>
        <div className="min-w-0">
          <form className="mb-3 flex flex-col gap-2 sm:flex-row" action={`${base}/students`}>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input name="q" defaultValue={q} placeholder={S.search} className="h-10 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-sm shadow-card outline-none focus:border-brand" />
            </div>
            <select name="group" defaultValue={groupId} className="h-10 rounded-xl border border-line bg-surface px-3 text-sm shadow-card">
              <option value="">{S.allGroups}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
              {!teacher && <option value="none">{S.notInGroup}</option>}
            </select>
            <button className="h-10 rounded-xl bg-brand px-4 text-sm font-semibold text-white">{t.common.filter}</button>
          </form>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-4 py-3 font-semibold">{S.colStudent}</th>
                  <th className="px-3 py-3 font-semibold">{S.colGroups}</th>
                  <th className="px-3 py-3 text-right font-semibold">{S.colAvgTest}</th>
                  <th className="px-3 py-3 text-right font-semibold">{S.colTests}</th>
                  <th className="px-3 py-3 text-right font-semibold">{S.colAccuracy}</th>
                  <th className="px-3 py-3 text-right font-semibold">{S.colWeek}</th>
                  <th className="px-4 py-3 text-right font-semibold">{S.colStreak}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="px-4 py-2.5">
                      <Link href={`${base}/students/${s.id}`} className="flex items-center gap-3">
                        <Avatar name={s.name} size={32} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold hover:text-brand">{s.name}</span>
                          <span className="block truncate text-xs text-muted">{s.email}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex max-w-64 flex-wrap gap-1">
                        {s.groups.length ? s.groups.map((g) => (g.subject ? <SubjectBadge key={g.id} name={g.subject.name} color={g.subject.color} /> : <Badge key={g.id}>{g.name}</Badge>)) : <span className="text-muted">—</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold tabular-nums">{s.avgTest !== null ? `${s.avgTest}%` : "—"}</td>
                    <td className="px-3 py-2.5 text-right text-muted tabular-nums">{s.testsTaken}</td>
                    <td className={cn("px-3 py-2.5 text-right tabular-nums", s.accuracy !== null && s.accuracy < 55 && "font-semibold text-danger")}>{s.accuracy === null ? "—" : `${s.accuracy}%`}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{s.weekQuestions ? fmt(S.weekQuestions, { n: s.weekQuestions }) : <span className="text-warning">{S.inactive}</span>}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{s.streak ? `🔥 ${s.streak}` : "—"}</td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">{teacher && all.length === 0 ? t.teacher.noStudents : S.noStudents}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {!teacher && <Card className="self-start">
          <CardHeader title={S.addTitle} subtitle={S.addSubtitle} action={<UserPlus className="size-4 text-muted" />} />
          <CardBody>
            <ActionForm action={createStudent} submitLabel={S.createAccount} resetOnSuccess>
              <Field label={t.auth.fullName}><Input name="name" required /></Field>
              <Field label={t.auth.email}><Input name="email" type="email" required /></Field>
              <Field label={t.fields.phone}><Input name="phone" type="tel" /></Field>
              <Field label={t.fields.grade}><Input name="grade" placeholder={S.gradePlaceholder} /></Field>
              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">{S.groups}</legend>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
                  {groups.map((g) => (
                    <label key={g.id} className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-surface-2">
                      <input type="checkbox" name="groupIds" value={g.id} className="size-4 accent-[var(--brand)]" /> {g.name}
                    </label>
                  ))}
                  {groups.length === 0 && <p className="px-2 py-1 text-xs text-muted">{S.noGroups}</p>}
                </div>
              </fieldset>
              <Field label={t.auth.password} hint={S.passwordHint}>
                <Input name="password" type="text" minLength={8} autoComplete="off" />
              </Field>
            </ActionForm>
          </CardBody>
        </Card>}
      </div>
    </div>
  );
}
