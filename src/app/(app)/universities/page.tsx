import type { Metadata } from "next";
import Link from "next/link";
import { Heart, MapPin, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { UniMap } from "@/components/uni-map";
import { SubmitButton } from "@/components/ui/submit-button";
import { setDreamUniversity } from "./actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Top Universities" };

const SORTS = { rank: "Featured", acceptance: "Most selective", name: "A–Z" } as const;

export default async function UniversitiesPage({ searchParams }: PageProps<"/universities">) {
  const user = await requireStudentArea();
  const sp = await searchParams;
  const country = typeof sp.country === "string" ? sp.country : "";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const sort = (typeof sp.sort === "string" && sp.sort in SORTS ? sp.sort : "rank") as keyof typeof SORTS;

  const all = await db.university.findMany({ orderBy: { rank: "asc" } });
  const countries = [...new Set(all.map((u) => u.country))].sort((a, b) => (a === "Uzbekistan" ? -1 : b === "Uzbekistan" ? 1 : a.localeCompare(b)));
  const list = all
    .filter((u) => (!country || u.country === country) && (!q || u.name.toLowerCase().includes(q.toLowerCase()) || u.city.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) =>
      sort === "acceptance" ? (a.acceptanceRate ?? 101) - (b.acceptanceRate ?? 101) : sort === "name" ? a.name.localeCompare(b.name) : a.rank - b.rank,
    );
  const qs = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(country ? { country } : {}), ...(q ? { q } : {}), ...(sort !== "rank" ? { sort } : {}), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return p.toString() ? `?${p}` : "";
  };

  return (
    <div>
      <PageHeader title="Top Universities" subtitle="Explore universities in Uzbekistan and around the world: requirements, acceptance rates, tuition and financial aid." />

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
          <Link href={`/universities${qs({ country: "" })}`} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", !country ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2")}>All countries</Link>
          {countries.map((c) => (
            <Link key={c} href={`/universities${qs({ country: c })}`} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", country === c ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2")}>{c}</Link>
          ))}
        </div>
        <div className="flex gap-1 rounded-xl border border-line bg-surface p-1 shadow-card lg:ml-auto">
          {(Object.keys(SORTS) as (keyof typeof SORTS)[]).map((s) => (
            <Link key={s} href={`/universities${qs({ sort: s === "rank" ? "" : s })}`} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", sort === s ? "bg-surface-3 text-ink" : "text-ink-2 hover:bg-surface-2")}>{SORTS[s]}</Link>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((u) => {
          const isTarget = user.targetUniId === u.id;
          return (
            <div key={u.id} className={cn("flex flex-col rounded-2xl border bg-surface p-5 shadow-card", isTarget ? "border-series-2 ring-4 ring-[color-mix(in_srgb,var(--series-2)_15%,transparent)]" : "border-line")}>
              <Link href={`/universities/${u.id}`} className="font-display text-[16px] font-bold text-ink hover:text-brand">{u.name}</Link>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted"><MapPin className="size-3" /> {u.city}, {u.country}</div>
              <p className="mt-3 line-clamp-3 flex-1 text-sm text-ink-2">{u.about}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-surface-2 p-2.5">
                  <dt className="text-[11px] text-muted">Acceptance</dt>
                  <dd className="font-bold">{u.acceptanceRate !== null ? `${u.acceptanceRate}%` : "—"}</dd>
                </div>
                <div className="rounded-xl bg-surface-2 p-2.5">
                  <dt className="text-[11px] text-muted">Tuition / yr</dt>
                  <dd className="font-bold">{u.tuition !== null ? `$${u.tuition.toLocaleString()}` : "See website"}</dd>
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
      <p className="mt-6 text-xs text-muted">Figures are approximate and change every year — always confirm on the university&apos;s website.</p>
    </div>
  );
}
