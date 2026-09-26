import { BadgeCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PasswordForm } from "@/app/(app)/profile/forms";
import { getT } from "@/lib/i18n/server";
import { DetailsForm } from "./details-form";

/** "My account" for teachers, center admins and the platform owner. */
export async function AccountPage({ user }: { user: { name: string; email: string; phone: string | null; loginId?: string | null } }) {
  const t = await getT();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t.nav.account} subtitle={t.account.subtitle} />
      {user.loginId && (
        <Card className="mb-6 flex flex-wrap items-center gap-3 p-5">
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
    </div>
  );
}
