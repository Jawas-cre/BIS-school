import type { Metadata } from "next";
import { MapPin, RefreshCw, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { CopyButton } from "@/components/copy-button";
import { AccentPicker } from "./accent-picker";
import { createBranch, deleteBranch, regenerateInvite, updateCenter } from "../_actions/center";

export const metadata: Metadata = { title: "Center settings" };

export default async function SettingsPage() {
  const admin = await requireCenterAdmin();
  const center = admin.center!;
  const branches = await db.branch.findMany({ where: { centerId: center.id }, orderBy: { name: "asc" }, include: { _count: { select: { users: true } } } });

  return (
    <div className="space-y-6">
      <PageHeader title="Center settings" subtitle="Your center's profile, brand color, branches and invite code." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Profile & branding" subtitle="The accent color is applied across your students' app" />
          <CardBody>
            <ActionForm action={updateCenter}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Center name"><Input name="name" defaultValue={center.name} required /></Field>
                <Field label="City"><Input name="city" defaultValue={center.city ?? ""} /></Field>
              </div>
              <Field label="About"><Textarea name="about" defaultValue={center.about ?? ""} maxLength={400} /></Field>
              <AccentPicker defaultValue={center.accent} />
            </ActionForm>
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Invite code" subtitle="Students enter it when creating an account" />
            <CardBody className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border border-line bg-surface-2 px-4 py-2 font-mono text-xl font-bold tracking-[0.3em]">{center.inviteCode}</span>
              <CopyButton text={center.inviteCode} />
              <ConfirmAction action={regenerateInvite} label="New code" confirm="Generate a new code? The old code will stop working." className="h-10 rounded-xl border border-line-strong px-3 text-ink-2">
                <RefreshCw className="size-4" /> New code
              </ConfirmAction>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Branches" />
            <CardBody className="space-y-4">
              <ul className="divide-y divide-line rounded-xl border border-line">
                {branches.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                    <MapPin className="size-4 text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{b.name}</span>
                      <span className="block text-xs text-muted">{[b.address, b.phone].filter(Boolean).join(" · ")} · {b._count.users} people</span>
                    </span>
                    <ConfirmAction action={deleteBranch.bind(null, b.id)} label="Delete branch" confirm={`Delete ${b.name}?`}>
                      <Trash2 className="size-4" />
                    </ConfirmAction>
                  </li>
                ))}
                {branches.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted">No branches yet.</li>}
              </ul>
              <ActionForm action={createBranch} submitLabel="Add branch" submitVariant="secondary" resetOnSuccess>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Field label="Name"><Input name="name" required /></Field>
                  <Field label="Address"><Input name="address" /></Field>
                  <Field label="Phone"><Input name="phone" /></Field>
                </div>
              </ActionForm>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
