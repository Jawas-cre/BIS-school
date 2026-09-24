import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PasswordForm } from "@/app/(app)/profile/forms";
import { getT } from "@/lib/i18n/server";
import { DetailsForm } from "./details-form";

/** "My account" for teachers, center admins and the platform owner. */
export async function AccountPage({ user }: { user: { name: string; email: string; phone: string | null } }) {
  const t = await getT();
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t.nav.account} subtitle={t.account.subtitle} />
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
