import Link from "next/link";
import type { Metadata } from "next";
import { ClipboardList, PartyPopper, Play, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { requireCandidate } from "@/lib/mock/session";
import { bandText } from "@/lib/mock/bands";
import { MockShell } from "@/components/mock/mock-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startMockTest } from "../actions";
import { fmt } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.mock.testsTitle) as () => Promise<Metadata>;

export default async function MockHome({ searchParams }: PageProps<"/mock/home">) {
  const candidate = await requireCandidate();
  const sp = await searchParams;
  const { t, date } = await getI18n();
  const M = t.mock;
  const [tests, attempts] = await Promise.all([
    db.mockTest.findMany({ where: { centerId: candidate.centerId, published: true }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, module: true } }),
    db.mockAttempt.findMany({ where: { candidateId: candidate.id }, orderBy: { startedAt: "desc" }, include: { test: { select: { title: true } } } }),
  ]);
  const open = new Set(attempts.filter((a) => a.section !== "DONE").map((a) => a.testId));
  const finished = attempts.filter((a) => a.section === "DONE");

  return (
    <MockShell centerName={candidate.center.name} accent={candidate.center.accent} candidate={candidate}>
      {sp.welcome && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-success/30 bg-success-soft p-4 text-success">
          <PartyPopper className="mt-0.5 size-5 shrink-0" />
          <p className="font-semibold">{fmt(M.welcome, { number: candidate.number })}</p>
        </div>
      )}
      <div className="space-y-8">
        <section>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{M.testsTitle}</h1>
          <p className="mt-1 text-muted">{M.testsSubtitle}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tests.map((test) => (
              <Card key={test.id}>
                <CardBody className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-display text-lg font-bold">{test.title}</h2>
                    <Badge>{test.module === "GENERAL_TRAINING" ? M.general : M.academic}</Badge>
                  </div>
                  <p className="text-sm text-muted">{M.sectionsLine}</p>
                  <form action={startMockTest.bind(null, test.id)} className="mt-auto">
                    <Button className="w-full">
                      {open.has(test.id) ? <RotateCcw className="size-4" /> : <Play className="size-4" />}
                      {open.has(test.id) ? M.continueTest : M.start}
                    </Button>
                  </form>
                </CardBody>
              </Card>
            ))}
            {tests.length === 0 && <p className="rounded-2xl border border-dashed border-line-strong p-8 text-center text-muted sm:col-span-2">{M.testsEmpty}</p>}
          </div>
        </section>

        <Card>
          <CardHeader title={M.resultsTitle} action={<ClipboardList className="size-4 text-muted" />} />
          <CardBody className="overflow-x-auto p-0 pt-3">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-2 font-semibold">{M.date}</th>
                  <th className="px-3 py-2 font-semibold">{M.test}</th>
                  {[M.listening, M.reading, M.writing, M.speaking, M.overall].map((h) => (
                    <th key={h} className="px-3 py-2 text-center font-semibold">{h}</th>
                  ))}
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {finished.map((a) => (
                  <tr key={a.id} className="border-b border-line last:border-0">
                    <td className="px-5 py-3 whitespace-nowrap">{date(a.finishedAt ?? a.startedAt)}</td>
                    <td className="px-3 py-3 font-semibold">{a.test.title}</td>
                    <td className="px-3 py-3 text-center font-bold tabular-nums">{bandText(a.listeningBand)}</td>
                    <td className="px-3 py-3 text-center font-bold tabular-nums">{bandText(a.readingBand)}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{a.released ? <b>{bandText(a.writingBand)}</b> : <span className="text-muted">{M.pending}</span>}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{a.released ? <b>{bandText(a.speakingBand)}</b> : <span className="text-muted">{M.pending}</span>}</td>
                    <td className="px-3 py-3 text-center">
                      {a.released && a.overallBand != null ? <span className="rounded-lg bg-brand px-2 py-0.5 font-extrabold text-white tabular-nums">{bandText(a.overallBand)}</span> : <span className="text-muted">—</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/mock/result/${a.id}`} className="font-semibold text-brand hover:underline">
                        {M.view}
                      </Link>
                    </td>
                  </tr>
                ))}
                {finished.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-muted">{M.resultsEmpty}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </MockShell>
  );
}
