import Link from "next/link";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  ClipboardCheck,
  Clock,
  Camera,
  Map,
  MapPin,
  Phone,
  Send,
  Sparkles,
  Trophy,
} from "lucide-react";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { siteData, socialUrl } from "@/lib/site";
import { submitLead } from "@/app/c/actions";
import { LanguageMenu } from "@/components/language-menu";
import { ThemeMenu } from "@/components/theme-menu";
import { ButtonLink } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { SubjectBadge } from "@/components/subject-icon";
import { TrialForm } from "./trial-form";
import { PLATFORM_NAME } from "@/lib/brand";
import { initials } from "@/lib/utils";
import { fmt } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

const FEATURE_ICONS = [Map, BookOpenCheck, ClipboardCheck, CalendarCheck, Sparkles, BarChart3];

function Section({ id, eyebrow, title, children, muted = false }: { id: string; eyebrow: string; title: string; children: React.ReactNode; muted?: boolean }) {
  return (
    <section id={id} className={muted ? "border-y border-line bg-surface" : undefined}>
      <div className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <p className="text-sm font-bold tracking-wider text-brand uppercase">{eyebrow}</p>
        <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

/** A learning center's public website, in the center's brand color. */
export async function CenterSite({ centerId }: { centerId: string }) {
  const [data, user, { t, num }] = await Promise.all([siteData(centerId), getCurrentUser(), getI18n()]);
  if (!data) notFound();
  const { center, courses, results, branches, teachers, students } = data;
  const S = t.site;
  const faq = data.faq.length ? data.faq.map((f) => ({ q: f.title, a: f.body ?? "" })) : S.defaultFaq;
  const telegram = socialUrl(center.telegram, "telegram");
  const instagram = socialUrl(center.instagram, "instagram");
  const nav = [
    courses.length > 0 && { href: "#courses", label: S.navCourses },
    teachers.length > 0 && { href: "#teachers", label: S.navTeachers },
    results.length > 0 && { href: "#results", label: S.navResults },
    branches.length > 0 && { href: "#branches", label: S.navBranches },
    { href: "#faq", label: S.navFaq },
  ].filter((x): x is { href: string; label: string } => Boolean(x));
  const stats: (false | { value: string | number; label: string })[] = [
    students > 0 && { value: num(students), label: S.statStudents },
    teachers.length > 0 && { value: teachers.length, label: S.statTeachers },
    courses.length > 0 && { value: courses.length, label: S.statCourses },
    branches.length > 0 && { value: branches.length, label: S.statBranches },
  ];
  const shownStats = stats.filter((x): x is { value: string | number; label: string } => Boolean(x));

  return (
    <div className="min-h-dvh" style={{ "--brand": center.accent } as CSSProperties}>
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-2.5">
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-brand font-display text-[13px] font-extrabold text-white">
              {initials(center.name)}
            </span>
            <span className="truncate font-display text-[17px] font-extrabold tracking-tight">{center.name}</span>
          </a>
          <nav className="ml-6 hidden items-center gap-5 text-sm font-semibold text-ink-2 lg:flex">
            {nav.map((n) => (
              <a key={n.href} href={n.href} className="hover:text-brand">{n.label}</a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageMenu />
            <ThemeMenu />
            {user ? (
              <ButtonLink href={homeFor(user.role)} size="sm">{S.openPlatform}</ButtonLink>
            ) : (
              <ButtonLink href="/login" size="sm" variant="ghost">{S.logIn}</ButtonLink>
            )}
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_85%_0%,color-mix(in_srgb,var(--brand)_22%,transparent),transparent_70%),radial-gradient(40%_60%_at_0%_100%,color-mix(in_srgb,var(--brand)_12%,transparent),transparent_70%)]" />
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.25fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-2 shadow-card">
                <span className="size-1.5 rounded-full bg-brand" /> {center.city ? fmt(S.badgeCity, { city: center.city }) : S.badge}
              </span>
              <h1 className="mt-5 font-display text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-5xl">{center.heroTitle || fmt(S.defaultHeadline, { name: center.name })}</h1>
              <p className="mt-5 max-w-xl text-lg text-muted">{center.heroText || center.about || S.defaultIntro}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="#trial" size="lg">{S.book} <ArrowRight className="size-4" /></ButtonLink>
                {courses.length > 0 && <ButtonLink href="#courses" size="lg" variant="outline">{S.seeCourses}</ButtonLink>}
              </div>
            </div>
            {shownStats.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {shownStats.map((s) => (
                  <div key={s.label} className="rounded-3xl border border-line bg-surface p-5 shadow-card">
                    <div className="font-display text-4xl font-extrabold text-brand">{s.value}</div>
                    <div className="mt-1 text-sm font-semibold text-muted">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {courses.length > 0 && (
          <Section id="courses" eyebrow={S.navCourses} title={S.coursesTitle} muted>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <div key={c.id} className="flex flex-col rounded-2xl border border-line bg-bg p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-bold">{c.title}</h3>
                    {c.meta && <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand">{c.meta}</span>}
                  </div>
                  {c.body && <p className="mt-2 flex-1 text-sm text-muted">{c.body}</p>}
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="font-display font-extrabold">{c.subtitle}</span>
                    <a href="#trial" className="text-sm font-semibold text-brand hover:underline">{S.signUp} →</a>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section id="why" eyebrow={S.whyEyebrow} title={fmt(S.whyTitle, { platform: PLATFORM_NAME })}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {S.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? Sparkles;
              return (
                <div key={f.title} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon className="size-5" /></span>
                  <h3 className="mt-3 font-display font-bold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted">{f.text}</p>
                </div>
              );
            })}
          </div>
        </Section>

        {teachers.length > 0 && (
          <Section id="teachers" eyebrow={S.navTeachers} title={S.teachersTitle} muted>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {teachers.map((tch) => (
                <div key={tch.id} className="rounded-2xl border border-line bg-bg p-5 text-center">
                  <div className="flex justify-center"><Avatar name={tch.name} size={64} /></div>
                  <h3 className="mt-3 font-display font-bold">{tch.name}</h3>
                  {tch.bio && <p className="mt-1 text-sm text-muted">{tch.bio}</p>}
                  {tch.subjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-1">
                      {tch.subjects.map((s) => <SubjectBadge key={s.name} name={s.name} color={s.color} />)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {results.length > 0 && (
          <Section id="results" eyebrow={S.navResults} title={S.resultsTitle}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {results.map((r) => (
                <div key={r.id} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                  <Trophy className="size-5 text-warning" />
                  <div className="mt-2 font-display text-2xl font-extrabold text-brand">{r.subtitle}</div>
                  <div className="mt-1 font-semibold">{r.title}</div>
                  {r.body && <p className="mt-1 text-sm text-muted">{r.body}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {branches.length > 0 && (
          <Section id="branches" eyebrow={S.navBranches} title={S.branchesTitle} muted>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((b) => (
                <div key={b.id} className="rounded-2xl border border-line bg-bg p-5">
                  <h3 className="font-display font-bold">{b.name}</h3>
                  {b.address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([b.address, center.city].filter(Boolean).join(", "))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-start gap-2 text-sm text-ink-2 hover:text-brand"
                    >
                      <MapPin className="mt-0.5 size-4 shrink-0" /> {b.address}
                    </a>
                  )}
                  {b.phone && (
                    <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`} className="mt-2 flex items-center gap-2 text-sm text-ink-2 hover:text-brand">
                      <Phone className="size-4" /> {b.phone}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        <Section id="faq" eyebrow={S.navFaq} title={S.faqTitle}>
          <div className="mx-auto max-w-3xl space-y-2">
            {faq.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-line bg-surface px-5 py-4 shadow-card">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                  {f.q}
                  <span className="text-muted transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-sm whitespace-pre-line text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </Section>

        <section id="trial" className="scroll-mt-20 border-t border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-sm font-bold tracking-wider text-brand uppercase">{S.trialEyebrow}</p>
              <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight">{S.trialTitle}</h2>
              <p className="mt-3 text-muted">{S.trialText}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {center.phone && (
                  <li><a href={`tel:${center.phone.replace(/[^\d+]/g, "")}`} className="flex items-center gap-2 font-semibold hover:text-brand"><Phone className="size-4 text-brand" /> {center.phone}</a></li>
                )}
                {telegram && (
                  <li><a href={telegram} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold hover:text-brand"><Send className="size-4 text-brand" /> Telegram</a></li>
                )}
                {instagram && (
                  <li><a href={instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold hover:text-brand"><Camera className="size-4 text-brand" /> Instagram</a></li>
                )}
                <li className="flex items-center gap-2 text-muted"><Clock className="size-4 text-brand" /> {S.replyTime}</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-line bg-bg p-5 shadow-card sm:p-6">
              <TrialForm action={submitLead.bind(null, center.id)} courses={courses.map((c) => c.title)} branches={branches.map((b) => b.name)} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm text-muted sm:px-6">
          <span>© {new Date().getFullYear()} {center.name}{center.city ? ` · ${center.city}` : ""}</span>
          <Link href="/login" className="hover:text-brand">{fmt(S.poweredBy, { platform: PLATFORM_NAME })}</Link>
        </div>
      </footer>
    </div>
  );
}
