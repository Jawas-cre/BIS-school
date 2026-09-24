import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { preview } from "@/lib/questions";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmAction } from "@/components/action-form";
import { deleteQuestion } from "../_actions/content";
import { SubjectBadge } from "@/components/subject-icon";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.adminQuestions);

export default async function AdminQuestions({ searchParams }: PageProps<"/admin/questions">) {
  const staff = await requireStaff();
  const { saved } = await searchParams;
  const t = await getT();
  const Q = t.adminQuestions;
  const [own, platformCount] = await Promise.all([
    db.question.findMany({ where: { centerId: staff.centerId }, orderBy: { createdAt: "desc" }, include: { subject: true, topic: true } }),
    db.question.count({ where: { centerId: null } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.nav.adminQuestions}
        subtitle={Q.subtitle}
        action={<ButtonLink href="/admin/questions/new"><Plus className="size-4" /> {Q.newQuestion}</ButtonLink>}
      />
      {saved && <p className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">{Q.saved}</p>}
      <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="text-xs font-semibold text-muted">{Q.yourQuestions}</div>
          <div className="font-display text-2xl font-extrabold">{own.length}</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="text-xs font-semibold text-muted">{Q.platformQuestions}</div>
          <div className="font-display text-2xl font-extrabold">{platformCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {own.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold">{Q.emptyTitle}</p>
            <p className="mt-1 text-sm text-muted">{Q.emptyText}</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {own.map((q) => (
              <li key={q.id} className="flex items-start gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink">{preview(q.stem, q.passage)}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    <SubjectBadge name={q.subject.name} color={q.subject.color} />
                    <span className="font-semibold text-ink-2">{q.topic.name}</span>
                    <DifficultyBadge difficulty={q.difficulty} />
                    {q.type === "SHORT" && <Badge>{t.bank.typedAnswer}</Badge>}
                  </div>
                </div>
                <Link href={`/admin/questions/${q.id}`} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label={t.common.edit}><Pencil className="size-4" /></Link>
                <ConfirmAction action={deleteQuestion.bind(null, q.id)} label={Q.deleteLabel} confirm={Q.deleteConfirm}>
                  <Trash2 className="size-4" />
                </ConfirmAction>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
