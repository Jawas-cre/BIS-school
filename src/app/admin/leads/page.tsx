import Link from "next/link";
import { Clock, ExternalLink, Inbox, MapPin, Phone, Trash2, UserPlus, BookOpen } from "lucide-react";
import { db } from "@/lib/db";
import { requireCenterAdmin } from "@/lib/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/site";
import { PageHeader, Avatar, EmptyState } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { ButtonLink } from "@/components/ui/button";
import { deleteLead, updateLead } from "../_actions/website";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.leads);

const TONE = { NEW: "brand", CONTACTED: "warning", ENROLLED: "success", CLOSED: "neutral" } as const;

/** Free trial lesson requests from the center's website. */
export default async function LeadsPage({ searchParams }: PageProps<"/admin/leads">) {
  const admin = await requireCenterAdmin();
  const sp = await searchParams;
  const { t, date } = await getI18n();
  const L = t.leads;
  const status = LEAD_STATUSES.find((s) => s === sp.status) ?? null;
  const [leads, counts] = await Promise.all([
    db.lead.findMany({ where: { centerId: admin.centerId, ...(status ? { status } : {}) }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.lead.groupBy({ by: ["status"], where: { centerId: admin.centerId }, _count: { _all: true } }),
  ]);
  const count = (s: LeadStatus) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count._all, 0);
  const site = `/c/${admin.center!.slug}`;
  const tabs = [{ key: null, label: t.common.all, n: total }, ...LEAD_STATUSES.map((s) => ({ key: s, label: L.status[s], n: count(s) }))];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.nav.leads}
        subtitle={L.subtitle}
        action={
          <ButtonLink href={site} target="_blank" rel="noreferrer" variant="outline">
            <ExternalLink className="size-4" /> {t.siteAdmin.open}
          </ButtonLink>
        }
      />

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1 shadow-card" aria-label={L.filter}>
        {tabs.map((tab) => (
          <Link
            key={tab.key ?? "all"}
            href={tab.key ? `/admin/leads?status=${tab.key}` : "/admin/leads"}
            aria-current={tab.key === status ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold",
              tab.key === status ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2",
            )}
          >
            {tab.label}
            <span className={cn("rounded-full px-1.5 text-xs tabular-nums", tab.key === status ? "bg-brand text-white" : "bg-surface-2 text-muted")}>{tab.n}</span>
          </Link>
        ))}
      </nav>

      {leads.length === 0 ? (
        <EmptyState icon={<Inbox className="size-6" />} title={status ? L.noneWithStatus : L.emptyTitle}>
          {status ? null : L.emptyText}
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {leads.map((lead) => (
            <Card key={lead.id} data-lead={lead.phone}>
              <CardBody className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar name={lead.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-display text-lg font-bold break-words">{lead.name}</span>
                      <Badge tone={TONE[lead.status as LeadStatus] ?? "neutral"}>{L.status[lead.status as LeadStatus] ?? lead.status}</Badge>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-brand hover:underline">
                        <Phone className="size-3.5" /> {lead.phone}
                      </a>
                      <time className="text-xs text-muted" dateTime={lead.createdAt.toISOString()}>
                        {date(lead.createdAt, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
                      </time>
                    </div>
                  </div>
                </div>
                {(lead.course || lead.branch || lead.time) && (
                  <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                    {lead.course && <li className="flex items-center gap-1.5"><BookOpen className="size-3.5 text-muted" /> {lead.course}</li>}
                    {lead.branch && <li className="flex items-center gap-1.5"><MapPin className="size-3.5 text-muted" /> {lead.branch}</li>}
                    {lead.time && <li className="flex items-center gap-1.5"><Clock className="size-3.5 text-muted" /> {lead.time}</li>}
                  </ul>
                )}
                {lead.message && <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm whitespace-pre-line break-words">{lead.message}</p>}
                <ActionForm action={updateLead.bind(null, lead.id)} submitLabel={t.common.save} submitVariant="secondary" className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
                    <Field label={L.statusLabel}>
                      <Select name="status" defaultValue={lead.status}>
                        {LEAD_STATUSES.map((s) => <option key={s} value={s}>{L.status[s]}</option>)}
                      </Select>
                    </Field>
                    <Field label={L.note}>
                      <Input name="note" defaultValue={lead.note ?? ""} placeholder={L.notePlaceholder} maxLength={500} />
                    </Field>
                  </div>
                </ActionForm>
                <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                  <ButtonLink
                    href={`/admin/students?${new URLSearchParams({ name: lead.name, phone: lead.phone })}#add`}
                    size="sm"
                    variant="ghost"
                  >
                    <UserPlus className="size-4" /> {L.createStudent}
                  </ButtonLink>
                  <div className="ml-auto">
                    <ConfirmAction action={deleteLead.bind(null, lead.id)} label={t.common.delete} confirm={fmt(L.deleteConfirm, { name: lead.name })}>
                      <Trash2 className="size-4" />
                    </ConfirmAction>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
