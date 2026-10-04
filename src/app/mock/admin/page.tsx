import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { bandText } from "@/lib/mock/bands";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.mockAdmin.navResults) as () => Promise<Metadata>;

export default async function MockResults({ searchParams }: PageProps<"/mock/admin">) {
  const staff = await requireStaff();
  const sp = await searchParams;
  const { t, date } = await getI18n();
  const A = t.mockAdmin;
  const M = t.mock;
  const show = sp.show === "all" ? "all" : "marking";
  const [attempts, toMark] = await Promise.all([
    db.mockAttempt.findMany({
      where: { centerId: staff.centerId, ...(show === "marking" ? { section: "DONE", released: false } : {}) },
      orderBy: { startedAt: "desc" },
      take: 300,
      include: { candidate: { select: { name: true, number: true } }, test: { select: { title: true } } },
    }),
    db.mockAttempt.count({ where: { centerId: staff.centerId, section: "DONE", released: false } }),
  ]);
  const tabs = [
    { key: "marking", label: A.toMark, n: toMark, href: "/mock/admin" },
    { key: "all", label: A.allResults, n: null, href: "/mock/admin?show=all" },
  ];
  return (
    <div className="space-y-5">
      <PageHeader title={A.navResults} subtitle={A.resultsSubtitle} />
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <Link key={tab.key} href={tab.href} className={cn("rounded-xl px-3 py-1.5 text-sm font-semibold", show === tab.key ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2")}>
            {tab.label}
            {tab.n !== null && <span className="ml-1.5 rounded-full bg-brand px-1.5 text-xs text-white tabular-nums">{tab.n}</span>}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-4 py-3 font-semibold">{A.candidate}</th>
              <th className="px-3 py-3 font-semibold">{M.test}</th>
              <th className="px-3 py-3 font-semibold">{M.date}</th>
              {["L", "R", "W", "S"].map((h) => (
                <th key={h} className="px-2 py-3 text-center font-semibold">{h}</th>
              ))}
              <th className="px-2 py-3 text-center font-semibold">{M.overall}</th>
              <th className="px-3 py-3 font-semibold">{A.status}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => {
              const done = a.section === "DONE";
              return (
                <tr key={a.id} className="border-b border-line last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-2.5">
                    <span className="block font-semibold">{a.candidate.name}</span>
                    <span className="block text-xs text-muted tabular-nums">{a.candidate.number}</span>
                  </td>
                  <td className="px-3 py-2.5">{a.test.title}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">{date(a.finishedAt ?? a.startedAt)}</td>
                  {[a.listeningBand, a.readingBand, a.writingBand, a.speakingBand].map((b, i) => (
                    <td key={i} className="px-2 py-2.5 text-center font-semibold tabular-nums">{bandText(b)}</td>
                  ))}
                  <td className="px-2 py-2.5 text-center font-extrabold tabular-nums">{bandText(a.overallBand)}</td>
                  <td className="px-3 py-2.5">
                    {!done ? <Badge>{fmtSection(a.section, A)}</Badge> : a.released ? <Badge tone="success">{A.released}</Badge> : <Badge tone="warning">{A.toMarkBadge}</Badge>}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {done && (
                      <Link href={`/mock/admin/results/${a.id}`} className="font-semibold text-brand hover:underline">
                        {a.released ? A.open : A.mark}
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {attempts.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-muted">{show === "marking" ? A.nothingToMark : A.noResults}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmtSection(section: string, A: { inProgress: string }) {
  return `${A.inProgress} · ${section.charAt(0)}${section.slice(1).toLowerCase()}`;
}
