import type { Metadata } from "next";
import { Search, Trash2, UserPlus } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { ActionForm, ConfirmAction } from "@/components/action-form";
import { createCandidate, deleteCandidate, resetCandidatePin } from "../actions";
import { fmt } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.mockAdmin.navCandidates) as () => Promise<Metadata>;

export default async function MockCandidates({ searchParams }: PageProps<"/mock/admin/candidates">) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const { t, date } = await getI18n();
  const A = t.mockAdmin;
  const M = t.mock;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const candidates = await db.mockCandidate.findMany({
    where: { centerId: staff.centerId, ...(q ? { OR: [{ name: { contains: q } }, { number: { contains: q } }, { phone: { contains: q.replace(/[^\d+]/g, "") || q } }] } : {}) },
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { _count: { select: { attempts: true } } },
  });
  return (
    <div className="space-y-5">
      <PageHeader title={A.navCandidates} subtitle={A.candidatesSubtitle} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-3">
          <form className="relative" action="/mock/admin/candidates">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input name="q" defaultValue={q} placeholder={A.searchCandidates} className="h-10 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-sm shadow-card outline-none focus:border-brand" />
          </form>
          <Card>
            <CardBody className="divide-y divide-line p-0">
              {candidates.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-muted tabular-nums">
                      {M.candidateNo} {c.number}
                      {c.phone ? ` · ${c.phone}` : ""} · {fmt(A.testsTaken, { n: c._count.attempts })} · {date(c.createdAt)}
                    </div>
                  </div>
                  <ActionForm action={resetCandidatePin.bind(null, c.id)} submitLabel={A.resetPin} submitVariant="ghost" submitClassName="h-8 px-2 text-sm" className="flex flex-row-reverse items-center gap-2 space-y-0">
                    <></>
                  </ActionForm>
                  {staff.role === "CENTER_ADMIN" && (
                    <ConfirmAction action={deleteCandidate.bind(null, c.id)} label={t.common.delete} confirm={fmt(A.deleteCandidateConfirm, { name: c.name })}>
                      <Trash2 className="size-4" />
                    </ConfirmAction>
                  )}
                </div>
              ))}
              {candidates.length === 0 && <p className="px-5 py-10 text-center text-sm text-muted">{q ? A.noMatches : A.noCandidates}</p>}
            </CardBody>
          </Card>
        </div>
        <Card className="self-start">
          <CardHeader title={A.addCandidate} subtitle={A.addCandidateHint} action={<UserPlus className="size-4 text-muted" />} />
          <CardBody>
            <ActionForm action={createCandidate} submitLabel={A.addCandidateButton} resetOnSuccess>
              <Field label={M.fullName}>
                <Input name="name" required maxLength={80} />
              </Field>
              <Field label={`${M.phone} (${t.common.optional.toLowerCase()})`}>
                <Input name="phone" type="tel" placeholder="+998 90 123 45 67" />
              </Field>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
