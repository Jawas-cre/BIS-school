import { Megaphone, Pin } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { Markdown } from "@/components/markdown";
import { EmptyState, PageHeader, Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_NAME } from "@/lib/brand";
import { fmt } from "@/lib/i18n/format";
import { newsTag } from "@/lib/i18n/labels";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.nav.news);

const TAG_TONE: Record<string, "brand" | "success" | "warning" | "neutral"> = {
  Announcement: "brand",
  Event: "warning",
  Update: "success",
  Tip: "neutral",
};

export default async function NewsPage() {
  const user = await requireStudentArea();
  const { t, date } = await getI18n();
  const N = t.news;
  const posts = await db.newsPost.findMany({
    where: visibleTo(user.centerId),
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t.nav.news} subtitle={fmt(N.subtitle, { center: user.center?.name ?? N.yourCenter, platform: PLATFORM_NAME })} />
      {posts.length === 0 && (
        <EmptyState icon={<Megaphone className="size-5" />} title={N.empty} />
      )}
      <div className="space-y-4">
        {posts.map((p) => (
          <article key={p.id} id={p.id} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {p.pinned && (
                <Badge tone="brand">
                  <Pin className="size-3" /> {N.pinned}
                </Badge>
              )}
              <Badge tone={TAG_TONE[p.tag] ?? "neutral"}>{newsTag(t, p.tag)}</Badge>
              <span className="text-xs text-muted">{date(p.createdAt)}</span>
            </div>
            <h2 className="mt-2 font-display text-xl font-bold">{p.title}</h2>
            <Markdown className="mt-2 text-[15px]">{p.body}</Markdown>
            <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-sm text-muted">
              <Avatar name={p.centerId ? (p.author?.name ?? user.center?.name ?? N.center) : PLATFORM_NAME} size={24} />
              {p.centerId ? `${p.author?.name ?? user.center?.name}` : fmt(N.team, { platform: PLATFORM_NAME })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
