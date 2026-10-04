import { requireSuperAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { AiSettingsCards } from "./ai-settings";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.aiTutor);

export default async function AiSettingsPage() {
  await requireSuperAdmin();
  const t = await getT();
  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.aiTutor} subtitle={t.aiSettings.subtitle} />
      <AiSettingsCards />
    </div>
  );
}
