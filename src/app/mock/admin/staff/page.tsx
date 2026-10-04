import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Trash2, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { MOCK_ONLY } from "@/lib/app-mode";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { createStaff, removeStaff } from "@/app/admin/_actions/people";
import { ensureTeacherId } from "@/lib/teacher-id";
import { fmt } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.mockAdmin.navStaff) as () => Promise<Metadata>;

// The CD mock's own site has no BIS Learn admin panel, so its admins add examiners here.
// Inside BIS Learn, staff are managed in the admin panel.
export default async function MockStaff() {
  if (!MOCK_ONLY) redirect("/admin/staff");
  const admin = await requireCenterAdmin();
  const t = await getT();
  const A = t.mockAdmin;
  const S = t.staff;
  const withoutId = await db.user.findMany({ where: { centerId: admin.centerId, role: "TEACHER", loginId: null } });
  for (const teacher of withoutId) await ensureTeacherId(teacher);
  const staff = await db.user.findMany({ where: { centerId: admin.centerId, role: { in: ["CENTER_ADMIN", "TEACHER"] } }, orderBy: [{ role: "asc" }, { name: "asc" }] });
  return (
    <div className="space-y-5">
      <PageHeader title={A.navStaff} subtitle={A.staffSubtitle} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="self-start">
          <CardBody className="divide-y divide-line p-0">
            {staff.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {s.name} {s.id === admin.id && <span className="text-xs font-normal text-muted">{S.you}</span>}
                  </div>
                  <div className="text-xs text-muted">{s.email}</div>
                </div>
                {s.loginId && (
                  <span className="rounded-lg border border-line bg-surface-2 px-2 py-0.5 font-mono text-xs font-bold" title={S.teacherId}>
                    {s.loginId}
                  </span>
                )}
                <Badge tone={s.role === "CENTER_ADMIN" ? "brand" : "neutral"}>{s.isOwner ? S.owner : s.role === "CENTER_ADMIN" ? S.admin : A.examiner}</Badge>
                {s.id !== admin.id && !s.isOwner && (
                  <ConfirmAction action={removeStaff.bind(null, s.id)} label={t.common.remove} confirm={fmt(S.removeConfirm, { name: s.name })}>
                    <Trash2 className="size-4" />
                  </ConfirmAction>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title={A.addStaff} action={<UserPlus className="size-4 text-muted" />} />
          <CardBody>
            <ActionForm action={createStaff} submitLabel={t.adminStudents.createAccount} resetOnSuccess>
              <Field label={t.auth.fullName}>
                <Input name="name" required maxLength={80} />
              </Field>
              <Field label={t.auth.email}>
                <Input name="email" type="email" required />
              </Field>
              <Field label={S.role}>
                <Select name="role" defaultValue="TEACHER">
                  <option value="TEACHER">{A.examiner}</option>
                  <option value="CENTER_ADMIN">{S.admin}</option>
                </Select>
              </Field>
              <Field label={t.codes.setPassword} hint={t.codes.setPasswordHint}>
                <Input name="password" type="text" minLength={8} autoComplete="off" />
              </Field>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
