import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ExternalLink, Globe, Heart, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea } from "@/lib/auth";
import { UniMap } from "@/components/uni-map";
import { SatRange, fitLabel } from "@/components/sat-range";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { setDreamUniversity } from "../actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "University" };

export default async function UniversityPage({ params }: PageProps<"/universities/[id]">) {
  const user = await requireStudentArea();
  const { id } = await params;
  const [u, latest] = await Promise.all([
    db.university.findUnique({ where: { id } }),
    db.testAttempt.findFirst({ where: { userId: user.id, status: "COMPLETED", totalScore: { not: null } }, orderBy: { finishedAt: "desc" }, select: { totalScore: true } }),
  ]);
  if (!u) notFound();
  const score = latest?.totalScore ?? null;
  const fit = fitLabel(score, u.satLow, u.satHigh);
  const isTarget = user.targetUniId === u.id;
  const toLow = score ? u.satLow - score : null;

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/universities" className="hover:text-ink">Top Universities</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate">{u.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>#{u.rank} on our list</Badge>
            {fit && <Badge tone={fit.tone}>{fit.text}</Badge>}
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">{u.name}</h1>
          <div className="mt-1 flex items-center gap-1 text-muted">
            <MapPin className="size-4" /> {u.city}, {u.country}
          </div>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-2">{u.about}</p>

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Acceptance rate", `${u.acceptanceRate}%`],
              ["SAT middle 50%", `${u.satLow}–${u.satHigh}`],
              ["Tuition / year", `$${u.tuition.toLocaleString()}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-surface-2 p-4">
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-0.5 font-display text-xl font-extrabold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand">Financial aid: {u.aid}</p>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold">Your score vs. admitted students</span>
              {score && <span className="text-muted">You: <strong className="text-ink">{score}</strong></span>}
            </div>
            <SatRange low={u.satLow} high={u.satHigh} score={score} className="h-3" />
            <div className="mt-1.5 flex justify-between text-[11px] text-muted"><span>1000</span><span>1600</span></div>
            <p className="mt-3 text-sm text-ink-2">
              {score === null
                ? "Take a full-length mock test to see how you compare."
                : toLow! > 0
                  ? `You need about ${toLow} more points to reach the bottom of the middle-50% range.`
                  : score < u.satHigh
                    ? "You're within the middle-50% range. Pushing toward the top of it strengthens your application."
                    : "Your score is at or above the top of the range — focus on the rest of your application."}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <form action={setDreamUniversity.bind(null, isTarget ? null : u.id)}>
              <SubmitButton variant={isTarget ? "secondary" : "primary"} pendingText="Saving…">
                <Heart className={cn("size-4", isTarget && "fill-current")} />
                {isTarget ? "Your dream university" : "Set as dream university"}
              </SubmitButton>
            </form>
            <a href={u.website} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-semibold hover:bg-surface-2">
              <Globe className="size-4" /> Admissions website <ExternalLink className="size-3.5" />
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">Figures are approximate and change every year — always confirm on the university&apos;s website.</p>
        </div>
        <div className="h-80 overflow-hidden rounded-3xl border border-line shadow-card lg:h-auto">
          <UniMap universities={[u]} targetId={user.targetUniId} center={[u.lat, u.lng]} zoom={11} />
        </div>
      </div>
    </div>
  );
}
