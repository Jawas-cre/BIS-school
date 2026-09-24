import type { Metadata } from "next";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { preview } from "@/lib/questions";
import { PageHeader } from "@/components/ui/misc";
import { Badge, DifficultyBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ConfirmAction } from "@/components/action-form";
import { deleteQuestion } from "../_actions/content";
import { SubjectBadge } from "@/components/subject-icon";

export const metadata: Metadata = { title: "Questions" };

export default async function AdminQuestions({ searchParams }: PageProps<"/admin/questions">) {
  const staff = await requireStaff();
  const { saved } = await searchParams;
  const [own, platformCount] = await Promise.all([
    db.question.findMany({ where: { centerId: staff.centerId }, orderBy: { createdAt: "desc" }, include: { subject: true, topic: true } }),
    db.question.count({ where: { centerId: null } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Questions"
        subtitle="Add your own questions to the bank. They appear alongside the platform questions for your students only, and can be used in your tests."
        action={<ButtonLink href="/admin/questions/new"><Plus className="size-4" /> New question</ButtonLink>}
      />
      {saved && <p className="rounded-xl bg-success-soft px-4 py-3 text-sm font-medium text-success">Question saved.</p>}
      <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="text-xs font-semibold text-muted">Your questions</div>
          <div className="font-display text-2xl font-extrabold">{own.length}</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
          <div className="text-xs font-semibold text-muted">Platform questions</div>
          <div className="font-display text-2xl font-extrabold">{platformCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {own.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold">You haven&apos;t added any questions yet.</p>
            <p className="mt-1 text-sm text-muted">Add questions for any subject — homework sets, past exam material you own, or your teachers&apos; favourite problems.</p>
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
                    {q.type === "SHORT" && <Badge>Typed answer</Badge>}
                  </div>
                </div>
                <Link href={`/admin/questions/${q.id}`} className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Edit"><Pencil className="size-4" /></Link>
                <ConfirmAction action={deleteQuestion.bind(null, q.id)} label="Delete question" confirm="Delete this question? It will be removed from any tests that use it.">
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
