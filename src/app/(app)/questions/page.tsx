import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, Check, ChevronLeft, ChevronRight, Circle, Search, X } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { bankQuery, filtersToQuery, parseFilters, preview, type BankFilters } from "@/lib/questions";
import { enrolledSubjectIds, visibleSubjects } from "@/lib/subjects";
import { PageHeader } from "@/components/ui/misc";
import { DifficultyBadge, Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { SubjectBadge, SubjectIcon } from "@/components/subject-icon";
import { cn, pct } from "@/lib/utils";

export const metadata: Metadata = { title: "Question Bank" };
const PAGE_SIZE = 20;

function FilterLink({ f, patch, active, children }: { f: BankFilters; patch: Partial<BankFilters>; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={`/questions${filtersToQuery({ ...f, ...patch })}`}
      className={cn("rounded-lg px-2.5 py-1.5 text-sm font-semibold whitespace-nowrap transition-colors", active ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2")}
    >
      {children}
    </Link>
  );
}

export default async function QuestionBankPage({ searchParams }: PageProps<"/questions">) {
  const user = await requireStudentArea();
  const sp = await searchParams;
  const subjects = await visibleSubjects(user.centerId);
  const enrolled = enrolledSubjectIds(user);
  const f = parseFilters(sp);
  // Default to the student's first subject so the list starts focused.
  if (!f.subject && !f.q && sp.all !== "1" && enrolled.length) f.subject = enrolled[0];
  const subject = subjects.find((s) => s.id === f.subject);
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ rows, results, saved }, scope] = await Promise.all([bankQuery(user, f), bankQuery(user, { subject: f.subject })]);
  const answered = scope.rows.filter((r) => results.has(r.id)).length;
  const correct = scope.rows.filter((r) => results.get(r.id) === true).length;
  const topicCounts = new Map<string, number>();
  for (const r of scope.rows) topicCounts.set(r.topicId, (topicCounts.get(r.topicId) ?? 0) + 1);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const shown = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const ordered = [...subjects].sort((a, b) => Number(enrolled.includes(b.id)) - Number(enrolled.includes(a.id)));

  return (
    <div>
      <PageHeader
        title="Question Bank"
        subtitle="Practise every topic at your own pace with step-by-step explanations. Filter by subject, topic, difficulty and your own results."
        action={
          rows[0] && (
            <ButtonLink href={`/questions/${(rows.find((r) => !results.has(r.id)) ?? rows[0]).id}${filtersToQuery(f)}`}>Start practising</ButtonLink>
          )
        }
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {ordered.map((s) => (
          <Link
            key={s.id}
            href={`/questions${filtersToQuery({ subject: s.id, status: f.status, difficulty: f.difficulty })}`}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-2xl border bg-surface py-2 pr-4 pl-2 shadow-card transition-colors",
              f.subject === s.id ? "border-brand ring-4 ring-brand-soft" : "border-line hover:border-line-strong",
            )}
          >
            <SubjectIcon icon={s.icon} color={s.color} size={32} />
            <span className="text-sm font-semibold">{s.name}</span>
            {enrolled.includes(s.id) && <span className="size-1.5 rounded-full bg-brand" title="Your subject" />}
          </Link>
        ))}
        <Link
          href={`/questions?all=1${f.status ? `&status=${f.status}` : ""}`}
          className={cn("flex shrink-0 items-center rounded-2xl border bg-surface px-4 text-sm font-semibold shadow-card", !f.subject ? "border-brand ring-4 ring-brand-soft" : "border-line")}
        >
          All subjects
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3 sm:max-w-xl">
        {[
          ["Questions", scope.rows.length],
          ["Answered", answered],
          ["Last try correct", `${pct(correct, answered)}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-surface p-3.5 shadow-card">
            <div className="text-xs font-semibold text-muted">{label}</div>
            <div className="font-display text-xl font-extrabold">{value}</div>
          </div>
        ))}
      </div>

      <div className={cn("grid gap-6", subject && "lg:grid-cols-[260px_1fr]")}>
        {subject && (
          <aside>
            <nav className="rounded-2xl border border-line bg-surface p-3 shadow-card" aria-label="Topics">
              <div className="px-2 pt-1 pb-2 text-[11px] font-bold tracking-wider text-muted uppercase">{subject.name} topics</div>
              <Link
                href={`/questions${filtersToQuery({ ...f, topic: undefined })}`}
                className={cn("flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px]", !f.topic ? "bg-brand-soft font-semibold text-brand" : "text-ink-2 hover:bg-surface-2")}
              >
                All topics <span className="text-xs text-muted tabular-nums">{scope.rows.length}</span>
              </Link>
              {subject.topics.map((t) => (
                <Link
                  key={t.id}
                  href={`/questions${filtersToQuery({ ...f, topic: t.id })}`}
                  className={cn("flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px]", f.topic === t.id ? "bg-brand-soft font-semibold text-brand" : "text-ink-2 hover:bg-surface-2")}
                >
                  <span className="truncate">{t.name}</span>
                  <span className="text-xs text-muted tabular-nums">{topicCounts.get(t.id) ?? 0}</span>
                </Link>
              ))}
            </nav>
          </aside>
        )}

        <section className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card xl:flex-row xl:items-center">
            <form className="relative flex-1" action="/questions">
              {Object.entries(f).map(([k, v]) => (k !== "q" && v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
              <input name="q" defaultValue={f.q} placeholder="Search questions…" className="h-9 w-full rounded-lg border border-line bg-surface-2 pr-3 pl-9 text-sm outline-none focus:border-brand" />
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

          {f.q && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted">{rows.length} results for</span>
              <Badge tone="brand">“{f.q}”</Badge>
              <Link href={`/questions${filtersToQuery({ ...f, q: undefined })}`} className="inline-flex items-center gap-1 text-muted hover:text-ink">
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
                        className={cn("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full", res === true && "bg-success text-white", res === false && "bg-danger text-white", res === undefined && "text-line-strong")}
                        title={res === true ? "Correct" : res === false ? "Incorrect" : "Not answered"}
                      >
                        {res === true ? <Check className="size-3" /> : res === false ? <X className="size-3" /> : <Circle className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] text-ink">{preview(r.stem, r.passage)}</span>
                        <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                          {!f.subject && <SubjectBadge name={r.subject.name} color={r.subject.color} />}
                          <span className="font-semibold text-ink-2">{r.topic.name}</span>
                          <DifficultyBadge difficulty={r.difficulty} />
                          {r.type === "SHORT" && <Badge>Typed answer</Badge>}
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
              <span className="text-muted">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <ButtonLink variant="outline" size="sm" href={`/questions${filtersToQuery(f, { page: page - 1 })}`} aria-disabled={page <= 1} className={cn(page <= 1 && "pointer-events-none opacity-40")}>
                  <ChevronLeft className="size-4" /> Prev
                </ButtonLink>
                <ButtonLink variant="outline" size="sm" href={`/questions${filtersToQuery(f, { page: page + 1 })}`} aria-disabled={page >= pages} className={cn(page >= pages && "pointer-events-none opacity-40")}>
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
