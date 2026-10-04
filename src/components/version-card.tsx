import { PackageCheck } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { installedVersion } from "@/lib/version";
import { getI18n } from "@/lib/i18n/server";

/** Which version this copy runs and whether it updates itself (nothing in a developer checkout). */
export async function VersionCard() {
  const [{ t, date }, version] = await Promise.all([getI18n(), installedVersion()]);
  if (!version) return null;
  const S = t.settings;
  return (
    <Card>
      <CardHeader title={S.versionTitle} subtitle={version.updates ? S.updatesOn : S.updatesOff} action={<PackageCheck className="size-4 text-muted" />} />
      <CardBody>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">{S.version}</dt>
            <dd className="font-mono font-bold">{version.sha}</dd>
          </div>
          {version.committedAt && (
            <div>
              <dt className="text-muted">{S.released}</dt>
              <dd className="font-semibold">{date(version.committedAt, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}</dd>
            </div>
          )}
          {version.installedAt && (
            <div>
              <dt className="text-muted">{S.installed}</dt>
              <dd className="font-semibold">{date(version.installedAt, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}</dd>
            </div>
          )}
        </dl>
      </CardBody>
    </Card>
  );
}
