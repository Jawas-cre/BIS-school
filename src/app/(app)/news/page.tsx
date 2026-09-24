import type { Metadata } from "next";
import { Megaphone, Pin } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { Markdown } from "@/components/markdown";
import { EmptyState, PageHeader, Avatar } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { PLATFORM_NAME } from "@/lib/brand";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "What's New" };

const TAG_TONE: Record<string, "brand" | "success" | "warning" | "neutral"> = {
  Announcement: "brand",
  Event: "warning",
  Update: "success",
  Tip: "neutral",
};

export default async function NewsPage() {
  const user = await requireStudentArea();
  const posts = await db.newsPost.findMany({
    where: visibleTo(user.centerId),
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="What's New" subtitle={`Announcements from ${user.center?.name ?? "your center"} and product updates from ${PLATFORM_NAME}.`} />
      {posts.length === 0 && (
        <EmptyState icon={<Megaphone className="size-5" />} title="No announcements yet" />
      )}
      <div className="space-y-4">
        {posts.map((p) => (
          <article key={p.id} id={p.id} className="scroll-mt-24 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {p.pinned && (
                <Badge tone="brand">
                  <Pin className="size-3" /> Pinned
                </Badge>
              )}
              <Badge tone={TAG_TONE[p.tag] ?? "neutral"}>{p.tag}</Badge>
              <span className="text-xs text-muted">{formatDate(p.createdAt)}</span>
            </div>
            <h2 className="mt-2 font-display text-xl font-bold">{p.title}</h2>
            <Markdown className="mt-2 text-[15px]">{p.body}</Markdown>
            <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-sm text-muted">
              <Avatar name={p.centerId ? (p.author?.name ?? user.center?.name ?? "Center") : PLATFORM_NAME} size={24} />
              {p.centerId ? `${p.author?.name ?? user.center?.name}` : `${PLATFORM_NAME} team`}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
