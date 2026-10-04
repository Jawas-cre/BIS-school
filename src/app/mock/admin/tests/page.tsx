import Link from "next/link";
import type { Metadata } from "next";
import { Copy, Eye, EyeOff, FilePlus2, Pencil, Sparkles, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { readContent, sectionKeys } from "@/lib/mock/tests";
import { PageHeader } from "@/components/ui/misc";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { addSampleTest, createMockTest, deleteMockTest, duplicateMockTest, togglePublished } from "../actions";
import { fmt } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.mockAdmin.navTests) as () => Promise<Metadata>;

export default async function MockTests() {
  const staff = await requireStaff();
  const t = await getT();
  const A = t.mockAdmin;
  const M = t.mock;
  const tests = await db.mockTest.findMany({ where: { centerId: staff.centerId }, orderBy: { createdAt: "desc" }, include: { _count: { select: { attempts: true } } } });
  const iconButton = "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-ink-2 hover:bg-surface-2";
  return (
    <div className="space-y-5">
      <PageHeader
        title={A.navTests}
        subtitle={A.testsSubtitle}
        action={
          <>
            <form action={addSampleTest}>
              <SubmitButton variant="outline" pendingText={A.adding}>
                <Sparkles className="size-4" /> {A.addSample}
              </SubmitButton>
            </form>
            <form action={createMockTest}>
              <Button>
                <FilePlus2 className="size-4" /> {A.newTest}
              </Button>
            </form>
          </>
        }
      />
      <div className="grid gap-3">
        {tests.map((test) => {
          const keys = sectionKeys(readContent(test.content));
          return (
            <Card key={test.id}>
              <CardBody className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/mock/admin/tests/${test.id}`} className="font-display text-lg font-bold hover:text-brand">
                      {test.title}
                    </Link>
                    <Badge tone={test.published ? "success" : "neutral"}>{test.published ? A.published : A.draft}</Badge>
                    <Badge>{test.module === "GENERAL_TRAINING" ? M.general : M.academic}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {fmt(A.counts, { l: keys.listening.total, r: keys.reading.total, attempts: test._count.attempts })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center">
                  <Link href={`/mock/admin/tests/${test.id}`} className={iconButton}>
                    <Pencil className="size-4" /> {t.common.edit}
                  </Link>
                  <form action={togglePublished.bind(null, test.id)}>
                    <button className={iconButton}>
                      {test.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />} {test.published ? A.unpublish : A.publish}
                    </button>
                  </form>
                  <form action={duplicateMockTest.bind(null, test.id)}>
                    <button className={iconButton} title={A.duplicate} aria-label={A.duplicate}>
                      <Copy className="size-4" />
                    </button>
                  </form>
                  {staff.role === "CENTER_ADMIN" && (
                    <ConfirmAction action={deleteMockTest.bind(null, test.id)} label={t.common.delete} confirm={fmt(A.deleteTestConfirm, { title: test.title })}>
                      <Trash2 className="size-4" />
                    </ConfirmAction>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
        {tests.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-10 text-center text-muted">{A.noTests}</p>}
      </div>
    </div>
  );
}
