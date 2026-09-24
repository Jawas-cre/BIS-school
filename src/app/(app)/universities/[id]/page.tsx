import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ExternalLink, Globe, Heart, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea } from "@/lib/auth";
import { UniMap } from "@/components/uni-map";
import { SubmitButton } from "@/components/ui/submit-button";
import { setDreamUniversity } from "../actions";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/i18n/format";
import { countryName } from "@/lib/i18n/labels";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.universities.uniTitle);

export default async function UniversityPage({ params }: PageProps<"/universities/[id]">) {
  const user = await requireStudentArea();
  const { id } = await params;
  const { t, num } = await getI18n();
  const U = t.universities;
  const u = await db.university.findUnique({ where: { id } });
  if (!u) notFound();
  const isTarget = user.targetUniId === u.id;

  return (
    <div className="mx-auto max-w-5xl">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/universities" className="hover:text-ink">{t.nav.universities}</Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate">{u.name}</span>
      </nav>
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{u.name}</h1>
          <div className="mt-1 flex items-center gap-1 text-muted"><MapPin className="size-4" /> {u.city}, {countryName(t, u.country)}</div>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-2">{u.about}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-2 p-4">
              <dt className="text-xs text-muted">{U.acceptanceRate}</dt>
              <dd className="mt-0.5 font-display text-xl font-extrabold">{u.acceptanceRate !== null ? `${u.acceptanceRate}%` : U.notPublished}</dd>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4">
              <dt className="text-xs text-muted">{U.tuitionIntl}</dt>
              <dd className="mt-0.5 font-display text-xl font-extrabold">{u.tuition !== null ? `$${num(u.tuition)}` : U.seeWebsite}</dd>
            </div>
          </dl>
          <div className="mt-6">
            <h2 className="font-display font-bold">{U.requirements}</h2>
            <p className="mt-1 text-sm text-ink-2">{u.requirements}</p>
          </div>
          <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm font-medium text-brand">{fmt(U.aid, { aid: u.aid })}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <form action={setDreamUniversity.bind(null, isTarget ? null : u.id)}>
              <SubmitButton variant={isTarget ? "secondary" : "primary"}>
                <Heart className={cn("size-4", isTarget && "fill-current")} />
                {isTarget ? U.yourDream : U.setDream}
              </SubmitButton>
            </form>
            <a href={u.website} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-semibold hover:bg-surface-2">
              <Globe className="size-4" /> {U.website} <ExternalLink className="size-3.5" />
            </a>
          </div>
          <p className="mt-4 text-xs text-muted">{U.disclaimer}</p>
        </div>
        <div className="h-80 overflow-hidden rounded-3xl border border-line shadow-card lg:h-auto">
          <UniMap universities={[u]} targetId={user.targetUniId} center={[u.lat, u.lng]} zoom={11} />
        </div>
      </div>
    </div>
  );
}
