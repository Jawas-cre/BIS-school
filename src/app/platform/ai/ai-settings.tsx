import { PlugZap, Sparkles } from "lucide-react";
import { aiSettings } from "@/lib/ai";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ActionForm } from "@/components/action-form";
import { saveAiSettings, testAiConnection } from "./actions";
import { AiFields } from "./ai-fields";
import { getT } from "@/lib/i18n/server";

/** Shows only the end of a saved key, e.g. "••••3f9a". */
function masked(key: string) {
  return key ? `••••${key.slice(-4)}` : "";
}

/** The AI connection and how to set it up: on /platform/ai, and in the CD mock's own settings. Callers check access. */
export async function AiSettingsCards() {
  const t = await getT();
  const P = t.aiSettings;
  const s = await aiSettings();
  return (
    <>
      <Card>
        <CardHeader title={P.connection} action={<Sparkles className="size-4 text-brand" />} />
        <CardBody>
          <ActionForm action={saveAiSettings} submitLabel={t.common.save}>
            <AiFields
              defaults={{
                provider: s.provider,
                claudeModel: s.claudeModel,
                claudeKeySaved: masked(s.claudeKey) || (process.env.ANTHROPIC_API_KEY ? P.envKey : ""),
                omnirouteUrl: s.omnirouteUrl,
                omnirouteModel: s.omnirouteModel,
                omnirouteKeySaved: masked(s.omnirouteKey),
              }}
            />
          </ActionForm>
          <div className="mt-5 border-t border-line pt-4">
            <ActionForm action={testAiConnection} submitLabel={P.test} submitVariant="outline" pendingText={P.testing}>
              <p className="flex items-center gap-2 text-sm text-muted">
                <PlugZap className="size-4" /> {P.testText}
              </p>
            </ActionForm>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={P.howTitle} subtitle={P.howSubtitle} />
        <CardBody>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-ink-2">
            <li>{P.how1}</li>
            <li>
              {P.how2} <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">npm install -g omniroute</code>
            </li>
            <li>
              {P.how3} <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">omniroute</code> {P.how3b}
            </li>
            <li>{P.how4}</li>
            <li>{P.how5}</li>
          </ol>
          <p className="mt-4 text-xs text-muted">{P.credit}</p>
        </CardBody>
      </Card>
    </>
  );
}
