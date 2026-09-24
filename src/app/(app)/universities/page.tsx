import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { UniMap } from "@/components/uni-map";
import { SatRange, fitLabel } from "@/components/sat-range";
import { SubmitButton } from "@/components/ui/submit-button";
import { setDreamUniversity } from "./actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Top Universities" };

const SORTS = { rank: "Ranking", acceptance: "Most selective", sat: "Highest SAT" } as const;

export default async function UniversitiesPage({ searchParams }: PageProps<"/universities">) {
  const user = await requireStudentArea();
  const sp = await searchParams;
  const country = typeof sp.country === "string" ? sp.country : "";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const sort = (typeof sp.sort === "string" && sp.sort in SORTS ? sp.sort : "rank") as keyof typeof SORTS;

  const [all, latest] = await Promise.all([
    db.university.findMany({ orderBy: { rank: "asc" } }),
    db.testAttempt.findFirst({
      where: { userId: user.id, status: "COMPLETED", totalScore: { not: null } },
      orderBy: { finishedAt: "desc" },
      select: { totalScore: true },
    }),
  ]);
  const score = latest?.totalScore ?? null;
  const countries = [...new Set(all.map((u) => u.country))].sort();
  const list = all
    .filter((u) => (!country || u.country === country) && (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.city.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (sort === "acceptance" ? a.acceptanceRate - b.acceptanceRate : sort === "sat" ? b.satHigh + b.satLow - (a.satHigh + a.satLow) : a.rank - b.rank));
  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(country ? { country } : {}), ...(q ? { q } : {}), ...(sort !== "rank" ? { sort } : {}), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return p.toString() ? `?${p}` : "";
  };

  return (
    <div>
      <PageHeader
        title="Top Universities"
        subtitle="Explore where our students apply: admission rates, SAT ranges, tuition and aid — and how your latest score compares."
      />

      <div className="mb-6 h-80 overflow-hidden rounded-2xl border border-line shadow-card sm:h-96">
        <UniMap universities={list} targetId={user.targetUniId} />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form className="relative lg:w-72" action="/universities">
          {country && <input type="hidden" name="country" value={country} />}
          {sort !== "rank" && <input type="hidden" name="sort" value={sort} />}
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search universities or cities…" className="h-10 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-sm shadow-card outline-none focus:border-brand" />
        </form>
        <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1 shadow-card">
          <Link href={`/universities${qs({ country: "" })}`} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", !country ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2")}>
            All countries
          </Link>
          {countries.map((c) => (
            <Link key={c} href={`/universities${qs({ country: c })}`} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", country === c ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2")}>
              {c}
            </Link>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl border border-line bg-surface p-1 shadow-card lg:ml-auto">
          {(Object.keys(SORTS) as (keyof typeof SORTS)[]).map((s) => (
            <Link key={s} href={`/universities${qs({ sort: s === "rank" ? "" : s })}`} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", sort === s ? "bg-surface-3 text-ink" : "text-ink-2 hover:bg-surface-2")}>
              {SORTS[s]}
            </Link>
          ))}
        </div>
      </div>

      {score && (
        <p className="mb-4 text-sm text-muted">
          Comparing with your latest mock score: <strong className="text-ink">{score}</strong>. Ranges show the middle 50% of admitted students (approximate).
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((u) => {
          const fit = fitLabel(score, u.satLow, u.satHigh);
          const isTarget = user.targetUniId === u.id;
          return (
            <div key={u.id} className={cn("flex flex-col rounded-2xl border bg-surface p-5 shadow-card", isTarget ? "border-series-2 ring-4 ring-[color-mix(in_srgb,var(--series-2)_15%,transparent)]" : "border-line")}>
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 font-display text-sm font-extrabold text-ink-2">#{u.rank}</span>
                {fit && <Badge tone={fit.tone}>{fit.text}</Badge>}
              </div>
              <Link href={`/universities/${u.id}`} className="mt-3 font-display text-[16px] font-bold text-ink hover:text-brand">
                {u.name}
              </Link>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                <MapPin className="size-3" /> {u.city}, {u.country}
              </div>
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-muted">SAT middle 50%</span>
                  <span className="font-semibold tabular-nums">{u.satLow}–{u.satHigh}</span>
                </div>
                <SatRange low={u.satLow} high={u.satHigh} score={score} />
              </div>
              <dl className="mt-4 grid flex-1 grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-surface-2 p-2.5">
                  <dt className="text-[11px] text-muted">Acceptance</dt>
                  <dd className="font-bold">{u.acceptanceRate}%</dd>
                </div>
                <div className="rounded-xl bg-surface-2 p-2.5">
                  <dt className="text-[11px] text-muted">Tuition / yr</dt>
                  <dd className="font-bold">${u.tuition.toLocaleString()}</dd>
                </div>
              </dl>
              <form action={setDreamUniversity.bind(null, isTarget ? null : u.id)} className="mt-4">
                <SubmitButton variant={isTarget ? "secondary" : "outline"} size="sm" className="w-full" pendingText="Saving…">
                  <Heart className={cn("size-4", isTarget && "fill-current")} />
                  {isTarget ? "Your dream university" : "Set as dream university"}
                </SubmitButton>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
