import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardCheck,
  GraduationCap,
  KeyRound,
  Languages,
  Library,
  ListChecks,
  Map,
  Sparkles,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { centerSignupOpen } from "@/lib/signup";
import { db } from "@/lib/db";
import { PLATFORM_NAME } from "@/lib/brand";
import { Logo } from "@/components/logo";
import { LanguageMenu } from "@/components/language-menu";
import { ThemeMenu } from "@/components/theme-menu";
import { fmt, rich } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import { SubjectIcon } from "@/components/subject-icon";

const FEATURE_ICONS = [ListChecks, ClipboardCheck, Map, Languages, Library, GraduationCap, Sparkles, BarChart3];
const STEP_ICONS = [Building2, KeyRound, Users];

export default async function Home() {
  const user = await getCurrentUser();
  if (!user && (await db.user.count()) === 0) redirect("/setup");
  const { t, num } = await getI18n();
  const L = t.landing;
  const [subjects, questions, tests, signupOpen] = await Promise.all([
    db.subject.findMany({ where: { centerId: null }, orderBy: { order: "asc" } }),
    db.question.count({ where: { centerId: null } }),
    db.test.count({ where: { centerId: null } }),
    centerSignupOpen(),
  ]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageMenu />
            <ThemeMenu />
            {user ? (
              <ButtonLink href={homeFor(user.role)} size="sm">
                {fmt(L.openPlatform, { name: PLATFORM_NAME })} <ArrowRight className="size-4" />
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">{L.logIn}</ButtonLink>
                <ButtonLink href="/register" size="sm">{L.joinWithCode}</ButtonLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "radial-gradient(60% 50% at 50% 0%, color-mix(in srgb, var(--brand) 16%, transparent), transparent 70%)" }} />
          <div className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-2 shadow-card">
              <span className="size-1.5 rounded-full bg-success" /> {L.badge}
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-6xl">
              {rich(L.heroTitle, { highlight: <span className="text-brand">{L.heroHighlight}</span> })}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
              {fmt(L.heroText, { name: PLATFORM_NAME })}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {user ? (
                <ButtonLink href={homeFor(user.role)} size="lg">{L.continueLearning} <ArrowRight className="size-4" /></ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/register" size="lg">{L.imStudent}</ButtonLink>
                  {signupOpen && <ButtonLink href="/register/center" size="lg" variant="outline">{L.runCenter}</ButtonLink>}
                </>
              )}
            </div>
            <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-2">
              {subjects.map((s) => (
                <span key={s.id} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3.5 pl-1 text-sm font-semibold shadow-card">
                  <SubjectIcon icon={s.icon} color={s.color} size={26} /> {s.name}
                </span>
              ))}
              <span className="flex items-center rounded-full border border-dashed border-line-strong px-3.5 text-sm font-semibold text-muted">{L.ownSubjects}</span>
            </div>
            <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3">
              {[
                [num(subjects.length), L.statSubjects],
                [num(questions), L.statQuestions],
                [num(tests), L.statTests],
              ].map(([v, l]) => (
                <div key={l} className="rounded-2xl border border-line bg-surface px-3 py-4 shadow-card">
                  <dt className="font-display text-2xl font-extrabold sm:text-3xl">{v}</dt>
                  <dd className="text-xs text-muted sm:text-sm">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight">{L.featuresTitle}</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted">{L.featuresText}</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {L.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? ListChecks;
              return (
                <div key={f.title} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                  <div className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="mt-4 font-display font-bold">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{f.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:items-center">
            <div>
              <p className="text-sm font-bold tracking-wider text-brand uppercase">{L.centersEyebrow}</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">{L.centersTitle}</h2>
              <p className="mt-3 text-muted">{L.centersText}</p>
              {signupOpen && (
                <ButtonLink href="/register/center" className="mt-6">
                  {L.createCenter} <ArrowRight className="size-4" />
                </ButtonLink>
              )}
            </div>
            <ol className="space-y-3">
              {L.steps.map((s, i) => {
                const Icon = STEP_ICONS[i] ?? Users;
                return (
                  <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-bg p-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand font-display font-extrabold text-white">{i + 1}</span>
                    <div>
                      <h3 className="flex items-center gap-2 font-display font-bold">
                        <Icon className="size-4 text-brand" /> {s.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{s.text}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">{L.readyTitle}</h2>
          <p className="mt-2 text-muted">{L.readyText}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/register" size="lg">{L.joinWithCode}</ButtonLink>
            <ButtonLink href="/login" size="lg" variant="outline">{L.logIn}</ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} {PLATFORM_NAME}</span>
          <span>{L.footer}</span>
        </div>
      </footer>
    </div>
  );
}
