import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ExternalLink, FileText, Library, PlayCircle, Search, Target } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SubjectBadge } from "@/components/subject-icon";

export const metadata: Metadata = { title: "Library" };

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "PRACTICE", label: "Practice & tools", icon: Target },
  { key: "BOOK", label: "Books", icon: BookOpen },
  { key: "GUIDE", label: "Guides & tools", icon: FileText },
  { key: "VIDEO", label: "Video courses", icon: PlayCircle },
] as const;

export default async function LibraryPage({ searchParams }: PageProps<"/library">) {
  const user = await requireStudentArea();
  const sp = await searchParams;
  const category = typeof sp.category === "string" ? sp.category : "";
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const items = await db.libraryItem.findMany({
    where: {
      AND: [
        visibleTo(user.centerId),
        category ? { category } : {},
        q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }, { author: { contains: q } }] } : {},
      ],
    },
    orderBy: [{ centerId: "desc" }, { createdAt: "desc" }],
    include: { subject: { select: { name: true, color: true } } },
  });

  return (
    <div>
      <PageHeader title="Library" subtitle="Books, practice tools, guides and video courses for every subject — hand-picked by your center and the platform." />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1 shadow-card">
          {CATEGORIES.map((c) => (
            <Link
              key={c.key}
              href={`/library${c.key || q ? `?${new URLSearchParams({ ...(c.key ? { category: c.key } : {}), ...(q ? { q } : {}) })}` : ""}`}
              className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold", category === c.key ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2")}
            >
              {c.label}
            </Link>
          ))}
        </div>
        <form className="relative sm:ml-auto sm:w-72" action="/library">
          {category && <input type="hidden" name="category" value={category} />}
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Search the library…" className="h-10 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-sm shadow-card outline-none focus:border-brand" />
        </form>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={<Library className="size-5" />} title="Nothing here yet">
          Try another category or search term.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => {
            const cat = CATEGORIES.find((c) => c.key === item.category);
            const Icon = cat && "icon" in cat ? cat.icon : FileText;
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-5" />
                  </div>
                  <ExternalLink className="size-4 text-muted group-hover:text-brand" />
                </div>
                <h3 className="mt-4 font-display text-[16px] font-bold text-ink group-hover:text-brand">{item.title}</h3>
                {item.author && <div className="text-xs text-muted">{item.author}</div>}
                {item.description && <p className="mt-2 flex-1 text-sm text-ink-2">{item.description}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.subject && <SubjectBadge name={item.subject.name} color={item.subject.color} />}
                  <Badge>{cat?.label ?? item.category}</Badge>
                  {item.centerId && <Badge tone="brand">From your center</Badge>}
                  {item.pages && <Badge>{item.pages} pages</Badge>}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
