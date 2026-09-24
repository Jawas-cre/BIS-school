import { GraduationCap, KeyRound, Power, RefreshCw, Trash2, UserRoundCog } from "lucide-react";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { inviteStatus } from "@/lib/invites";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import { createInviteCode, deleteInviteCode, regenerateGeneralCode, toggleInviteCode } from "../_actions/codes";
import { CodeFields } from "./code-fields";
import { fmt, rich } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.codes);

const STATUS_TONE = { active: "success", disabled: "neutral", expired: "warning", usedUp: "danger" } as const;

export default async function InviteCodesPage() {
  const admin = await requireCenterAdmin();
  const { t, date } = await getI18n();
  const C = t.codes;
  const center = admin.center!;
  const [codes, groups] = await Promise.all([
    db.inviteCode.findMany({ where: { centerId: center.id }, orderBy: { createdAt: "desc" }, include: { group: { select: { name: true } } } }),
    db.group.findMany({ where: { centerId: center.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title={t.nav.codes} subtitle={rich(C.subtitle, { register: <strong>/register</strong> })} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader title={C.generalTitle} subtitle={C.generalSub} action={<KeyRound className="size-4 text-muted" />} />
            <CardBody className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl border border-line bg-surface-2 px-4 py-2 font-mono text-xl font-bold tracking-[0.3em]">{center.inviteCode}</span>
              <CopyButton text={center.inviteCode} label={C.copyCode} />
              <CopyButton text={`/register?code=${center.inviteCode}`} absolute label={C.copyLink} />
              <ConfirmAction action={regenerateGeneralCode} label={C.newGeneral} confirm={C.newGeneralConfirm} className="h-10 rounded-xl border border-line-strong px-3 text-ink-2">
                <RefreshCw className="size-4" /> {C.newGeneral}
              </ConfirmAction>
            </CardBody>
          </Card>

          <h2 className="pt-2 font-display text-lg font-bold">{C.listTitle}</h2>
          {codes.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-sm text-muted">{C.empty}</p>}
          {codes.map((c) => {
            const status = inviteStatus(c);
            const teacher = c.role === "TEACHER";
            return (
              <Card key={c.id} className={cn(status !== "active" && "opacity-75")}>
                <CardBody className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={cn("grid size-10 place-items-center rounded-xl", teacher ? "bg-warning-soft text-warning" : "bg-brand-soft text-brand")}>
                      {teacher ? <UserRoundCog className="size-5" /> : <GraduationCap className="size-5" />}
                    </span>
                    <span className="font-mono text-xl font-bold tracking-[0.2em]">{c.code}</span>
                    <Badge tone={teacher ? "warning" : "brand"}>{teacher ? C.roleTeacher : C.roleStudent}</Badge>
                    <Badge tone={STATUS_TONE[status]}>{C.status[status]}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    {c.label && <span className="font-medium text-ink-2">{c.label}</span>}
                    {c.group && <span>{c.group.name}</span>}
                    <span>{c.maxUses !== null ? fmt(C.uses, { uses: c.uses, max: c.maxUses }) : fmt(C.usesUnlimited, { uses: c.uses })}</span>
                    {c.expiresAt && <span>{fmt(C.until, { date: date(c.expiresAt) })}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CopyButton text={c.code} label={C.copyCode} />
                    <CopyButton text={`/register?code=${c.code}`} absolute label={C.copyLink} />
                    <form action={toggleInviteCode.bind(null, c.id)}>
                      <button className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line-strong px-3 text-sm font-semibold text-ink-2 hover:bg-surface-2">
                        <Power className="size-4" /> {c.active ? C.disable : C.enable}
                      </button>
                    </form>
                    <ConfirmAction action={deleteInviteCode.bind(null, c.id)} label={C.deleteLabel} confirm={fmt(C.deleteConfirm, { code: c.code })} className="ml-auto">
                      <Trash2 className="size-4" />
                    </ConfirmAction>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        <Card className="self-start">
          <CardHeader title={C.createTitle} subtitle={C.createSub} />
          <CardBody>
            <ActionForm action={createInviteCode} submitLabel={C.create} resetOnSuccess>
              <CodeFields groups={groups} />
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
