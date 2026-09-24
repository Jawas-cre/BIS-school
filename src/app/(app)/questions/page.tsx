import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Check, ChevronLeft, ChevronRight, Circle, Search, X } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { bankQuery, filtersToQuery, parseFilters, preview, skillCounts, type BankFilters } from "@/lib/questions";
import { SECTION_LABEL, type Section } from "@/lib/sat";
import { PageHeader } from "@/components/ui/misc";
import { DifficultyBadge, Badge } from "@/components/ui/badge";
import { cn, pct } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Question Bank" };
const PAGE_SIZE = 20;

function FilterLink({ f, patch, active, children }: { f: BankFilters; patch: Partial<BankFilters>; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={`/questions${filtersToQuery({ ...f, ...patch })}`}
      className={cn(
        "rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors",
        active ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2",
      )}
    >
      {children}
    </Link>
  );
}

export default async function QuestionBankPage({ searchParams }: PageProps<"/questions">) {
  const user = await requireStudentArea();
  const sp = await searchParams;
  const f = parseFilters(sp);
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rows, results, saved }, all] = await Promise.all([
    bankQuery(user, f),
    bankQuery(user, { section: f.section }),
  ]);
  const tree = skillCounts(all.rows).filter((s) => !f.section || s.section === f.section);
  const answered = all.rows.filter((r) => results.has(r.id)).length;
  const correct = all.rows.filter((r) => results.get(r.id) === true).length;
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Question Bank"
        subtitle="Work through every topic at your own pace with full step-by-step explanations. Filter by skill, difficulty and your own results."
        action={
          shown[0] && (
            <ButtonLink href={`/questions/${(rows.find((r) => !results.has(r.id)) ?? rows[0]).id}${filtersToQuery(f)}`}>
              Start practising
            </ButtonLink>
          )
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3 sm:max-w-xl">
        <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-card">
          <div className="text-xs font-semibold text-muted">In bank</div>
          <div className="font-display text-xl font-extrabold">{all.rows.length}</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-card">
          <div className="text-xs font-semibold text-muted">Answered</div>
          <div className="font-display text-xl font-extrabold">{answered}</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-3.5 shadow-card">
          <div className="text-xs font-semibold text-muted">Last try correct</div>
          <div className="font-display text-xl font-extrabold">{pct(correct, answered)}%</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-3 shadow-card">
            <div className="flex gap-1">
              <FilterLink f={{}} patch={{ status: f.status, difficulty: f.difficulty }} active={!f.section}>All</FilterLink>
              {(["RW", "MATH"] as Section[]).map((s) => (
                <FilterLink key={s} f={{}} patch={{ section: s, status: f.status, difficulty: f.difficulty }} active={f.section === s}>
                  {s === "RW" ? "R&W" : "Math"}
                </FilterLink>
              ))}
            </div>
          </div>
          <nav className="rounded-2xl border border-line bg-surface p-3 shadow-card" aria-label="Skills">
            {tree.map(({ section, domains }) => (
              <div key={section} className="mb-3 last:mb-0">
                <div className="px-2 pt-1 pb-2 text-[11px] font-bold tracking-wider text-muted uppercase">{SECTION_LABEL[section]}</div>
                {domains.map((d) => (
                  <div key={d.domain} className="mb-2">
                    <Link
                      href={`/questions${filtersToQuery({ ...f, domain: d.domain, skill: undefined, section })}`}
                      className={cn(
                        "block rounded-lg px-2 py-1 text-[13px] font-bold hover:bg-surface-2",
                        f.domain === d.domain && !f.skill ? "text-brand" : "text-ink",
                      )}
                    >
                      {d.domain}
                    </Link>
                    {d.skills.map((s) => (
                      <Link
                        key={s.skill}
                        href={`/questions${filtersToQuery({ ...f, skill: s.skill, domain: undefined, section })}`}
                        className={cn(
                          "flex items-center justify-between rounded-lg py-1 pr-2 pl-4 text-[13px] hover:bg-surface-2",
                          f.skill === s.skill ? "bg-brand-soft font-semibold text-brand" : "text-ink-2",
                        )}
                      >
                        <span className="truncate">{s.skill}</span>
                        <span className="text-xs text-muted tabular-nums">{s.count}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card xl:flex-row xl:items-center">
            <form className="relative flex-1" action="/questions">
              {Object.entries(f).map(([k, v]) => (k !== "q" && v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input
                name="q"
                defaultValue={f.q}
                placeholder="Search questions…"
                className="h-9 w-full rounded-lg border border-line bg-surface-2 pr-3 pl-9 text-sm outline-none focus:border-brand"
              />
            </form>
            <div className="flex flex-wrap gap-1">
              {[undefined, "EASY", "MEDIUM", "HARD"].map((d) => (
                <FilterLink key={d ?? "any"} f={f} patch={{ difficulty: d }} active={f.difficulty === d}>
                  {d ? d[0] + d.slice(1).toLowerCase() : "Any level"}
                </FilterLink>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {([undefined, "new", "incorrect", "correct", "saved"] as const).map((s) => (
                <FilterLink key={s ?? "all"} f={f} patch={{ status: s }} active={f.status === s}>
                  {s ? s[0].toUpperCase() + s.slice(1) : "All"}
                </FilterLink>
              ))}
            </div>
          </div>

          {(f.skill || f.domain || f.q) && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">{rows.length} questions</span>
              {[f.skill, f.domain, f.q && `“${f.q}”`].filter(Boolean).map((label) => (
                <Badge key={label as string} tone="brand">{label}</Badge>
              ))}
              <Link href={`/questions${filtersToQuery({ section: f.section })}`} className="inline-flex items-center gap-1 text-muted hover:text-ink">
                <X className="size-3.5" /> Clear
              </Link>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
            {shown.length === 0 && <p className="p-10 text-center text-muted">No questions match these filters.</p>}
            <ul className="divide-y divide-line">
              {shown.map((r, i) => {
                const res = results.get(r.id);
                return (
                  <li key={r.id}>
                    <Link href={`/questions/${r.id}${filtersToQuery(f)}`} className="flex items-start gap-4 px-4 py-3.5 transition-colors hover:bg-surface-2 sm:px-5">
                      <span className="mt-0.5 w-7 shrink-0 text-right text-xs font-semibold text-muted tabular-nums">{(page - 1) * PAGE_SIZE + i + 1}</span>
                      <span
                        className={cn(
                          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full",
                          res === true && "bg-success text-white",
                          res === false && "bg-danger text-white",
                          res === undefined && "text-line-strong",
                        )}
                        title={res === true ? "Correct" : res === false ? "Incorrect" : "Not answered"}
                      >
                        {res === true ? <Check className="size-3" /> : res === false ? <X className="size-3" /> : <Circle className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] text-ink">{preview(r.stem, r.passage)}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                          <span className="font-semibold text-ink-2">{r.skill}</span>
                          <DifficultyBadge difficulty={r.difficulty} />
                          {r.type === "SPR" && <Badge>Grid-in</Badge>}
                          {r.centerId && <Badge tone="brand">Center</Badge>}
                        </span>
                      </span>
                      {saved.has(r.id) && <Bookmark className="mt-0.5 size-4 shrink-0 fill-brand text-brand" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted">
                Page {page} of {pages}
              </span>
              <div className="flex gap-2">
                <ButtonLink
                  variant="outline"
                  size="sm"
                  href={`/questions${filtersToQuery(f, { page: page - 1 })}`}
                  aria-disabled={page <= 1}
                  className={cn(page <= 1 && "pointer-events-none opacity-40")}
                >
                  <ChevronLeft className="size-4" /> Prev
                </ButtonLink>
                <ButtonLink
                  variant="outline"
                  size="sm"
                  href={`/questions${filtersToQuery(f, { page: page + 1 })}`}
                  aria-disabled={page >= pages}
                  className={cn(page >= pages && "pointer-events-none opacity-40")}
                >
                  Next <ChevronRight className="size-4" />
                </ButtonLink>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
