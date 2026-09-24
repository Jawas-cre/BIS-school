import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { PageHeader, Avatar } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { createStaff, removeStaff } from "../_actions/people";
import Link from "next/link";
import { fmt } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.staff);

export default async function StaffPage() {
  const admin = await requireCenterAdmin();
  const t = await getT();
  const S = t.staff;
  const [staff, branches] = await Promise.all([
    db.user.findMany({
      where: { centerId: admin.centerId, role: { in: ["CENTER_ADMIN", "TEACHER"] } },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      include: { teaching: { select: { name: true } }, branch: { select: { name: true } } },
    }),
    db.branch.findMany({ where: { centerId: admin.centerId }, orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.staff} subtitle={S.subtitle} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardBody className="divide-y divide-line p-0">
            {staff.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <Avatar name={s.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{s.name} {s.id === admin.id && <span className="text-xs font-normal text-muted">{S.you}</span>}</div>
                  <div className="text-xs text-muted">{s.email}{s.branch ? ` · ${s.branch.name}` : ""}</div>
                  {s.teaching.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{s.teaching.map((g) => <Badge key={g.name}>{g.name}</Badge>)}</div>}
                </div>
                <Badge tone={s.role === "CENTER_ADMIN" ? "brand" : "neutral"}>{s.role === "CENTER_ADMIN" ? S.admin : S.teacher}</Badge>
                {s.id !== admin.id && (
                  <ConfirmAction action={removeStaff.bind(null, s.id)} label={t.common.remove} confirm={fmt(S.removeConfirm, { name: s.name })}>
                    <Trash2 className="size-4" />
                  </ConfirmAction>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title={S.addTitle} />
          <CardBody>
            <ActionForm action={createStaff} submitLabel={t.adminStudents.createAccount} resetOnSuccess>
              <Field label={t.auth.fullName}><Input name="name" required /></Field>
              <Field label={t.auth.email}><Input name="email" type="email" required /></Field>
              <Field label={S.role}>
                <Select name="role" defaultValue="TEACHER">
                  <option value="TEACHER">{S.teacher}</option>
                  <option value="CENTER_ADMIN">{S.admin}</option>
                </Select>
              </Field>
              <Field label={t.fields.branch}>
                <Select name="branchId" defaultValue="">
                  <option value="">—</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </Field>
              <Field label={t.codes.setPassword} hint={t.codes.setPasswordHint}>
                <Input name="password" type="text" minLength={8} autoComplete="off" />
              </Field>
            </ActionForm>
            <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
              {t.codes.teacherTip}{" "}
              <Link href="/admin/codes" className="font-semibold text-brand hover:underline">{t.codes.manage} →</Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
