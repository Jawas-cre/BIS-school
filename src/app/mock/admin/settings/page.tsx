import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { canManagePlatform, panelBase, requireStaff } from "@/lib/auth";
import { MOCK_ONLY } from "@/lib/app-mode";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { ActionForm } from "@/components/action-form";
import { DetailsForm } from "@/components/account/details-form";
import { PasswordForm } from "@/app/(app)/profile/forms";
import { AccentPicker } from "@/app/admin/settings/accent-picker";
import { updateCenter } from "@/app/admin/_actions/center";
import { AiSettingsCards } from "@/app/platform/ai/ai-settings";
import { VersionCard } from "@/components/version-card";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.mockAdmin.navSettings) as () => Promise<Metadata>;

// Settings on the CD mock's own site, which has no BIS Learn panels: everyone's own account, the
// center's name and color for admins, and the AI for Writing estimates for the owner.
// Inside BIS Learn, these live in the panels' own account and settings pages.
export default async function MockSettings() {
  const user = await requireStaff();
  if (!MOCK_ONLY) redirect(`${panelBase(user.role)}/account`);
  const t = await getT();
  const A = t.mockAdmin;
  const center = user.center!;
  return (
    <div className="space-y-6">
      <PageHeader title={A.navSettings} subtitle={A.settingsSubtitle} />
      {user.loginId && (
        <Card className="flex flex-wrap items-center gap-3 p-5">
          <BadgeCheck className="size-5 text-brand" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{t.account.teacherId}</div>
            <p className="text-sm text-muted">{t.account.teacherIdHint}</p>
          </div>
          <span className="rounded-xl border border-line bg-surface-2 px-3 py-1.5 font-mono text-base font-bold tracking-widest">{user.loginId}</span>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="self-start">
          <CardHeader title={t.account.detailsTitle} />
          <CardBody>
            <DetailsForm name={user.name} email={user.email} phone={user.phone ?? ""} />
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title={t.account.passwordTitle} subtitle={t.account.passwordSub} />
          <CardBody>
            <PasswordForm />
          </CardBody>
        </Card>
      </div>
      {user.role === "CENTER_ADMIN" && (
        <Card>
          <CardHeader title={A.centerTitle} subtitle={A.centerHint} />
          <CardBody>
            <ActionForm action={updateCenter}>
              <Field label={t.settings.centerName}>
                <Input name="name" defaultValue={center.name} required maxLength={80} />
              </Field>
              {/* Not shown on the mock's site, but kept as they are. */}
              <input type="hidden" name="city" value={center.city ?? ""} />
              <input type="hidden" name="about" value={center.about ?? ""} />
              <AccentPicker defaultValue={center.accent} />
            </ActionForm>
          </CardBody>
        </Card>
      )}
      {canManagePlatform(user) && <AiSettingsCards />}
      <VersionCard />
    </div>
  );
}
