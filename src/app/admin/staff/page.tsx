import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { PageHeader, Avatar } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { createStaff, removeStaff } from "../_actions/people";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const admin = await requireCenterAdmin();
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
      <PageHeader title="Staff" subtitle="Teachers manage groups, content and students. Admins also manage staff and center settings." />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card>
          <CardBody className="divide-y divide-line p-0">
            {staff.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <Avatar name={s.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{s.name} {s.id === admin.id && <span className="text-xs font-normal text-muted">(you)</span>}</div>
                  <div className="text-xs text-muted">{s.email}{s.branch ? ` · ${s.branch.name}` : ""}</div>
                  {s.teaching.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{s.teaching.map((g) => <Badge key={g.name}>{g.name}</Badge>)}</div>}
                </div>
                <Badge tone={s.role === "CENTER_ADMIN" ? "brand" : "neutral"}>{s.role === "CENTER_ADMIN" ? "Admin" : "Teacher"}</Badge>
                {s.id !== admin.id && (
                  <ConfirmAction action={removeStaff.bind(null, s.id)} label="Remove" confirm={`Remove ${s.name}'s account?`}>
                    <Trash2 className="size-4" />
                  </ConfirmAction>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title="Add staff member" />
          <CardBody>
            <ActionForm action={createStaff} submitLabel="Create account" resetOnSuccess>
              <Field label="Full name"><Input name="name" required /></Field>
              <Field label="Email"><Input name="email" type="email" required /></Field>
              <Field label="Role">
                <Select name="role" defaultValue="TEACHER">
                  <option value="TEACHER">Teacher</option>
                  <option value="CENTER_ADMIN">Admin</option>
                </Select>
              </Field>
              <Field label="Branch">
                <Select name="branchId" defaultValue="">
                  <option value="">—</option>
                  {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </Field>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
