import { requireSuperAdmin } from "@/lib/auth";
import { AccountPage } from "@/components/account/account-page";
import { pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.account);

export default async function PlatformAccount() {
  const user = await requireSuperAdmin();
  return <AccountPage user={user} />;
}
