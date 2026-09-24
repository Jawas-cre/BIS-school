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
import { getCurrentUser, homeFor } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLATFORM_NAME } from "@/lib/brand";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ButtonLink } from "@/components/ui/button";
import { SubjectIcon } from "@/components/subject-icon";

const FEATURES = [
  { icon: ListChecks, title: "Question Bank", text: "Questions for every subject and topic, filterable by difficulty and your own results, with step-by-step explanations." },
  { icon: ClipboardCheck, title: "Mock Tests", text: "Timed exams and topic quizzes with sections, mark for review, a question navigator and instant results." },
  { icon: Map, title: "Roadmap", text: "A course for each subject with video lessons and notes that unlocks one unit at a time, with a quiz to prove each topic." },
  { icon: Languages, title: "Vocabulary", text: "Spaced-repetition flashcards for languages and key terms in any subject." },
  { icon: Library, title: "Library", text: "Books, practice tools, guides and video courses curated by the platform and your teachers." },
  { icon: GraduationCap, title: "Top Universities", text: "Explore universities in Uzbekistan and abroad on a map and set your dream school." },
  { icon: Sparkles, title: "AI Assistant", text: "A tutor for every subject that knows your goal and weak spots, explains any problem and builds study plans." },
  { icon: BarChart3, title: "Progress analytics", text: "Test results over time, accuracy by subject, streaks and how you compare with your group." },
];

const CENTER_STEPS = [
  { icon: Building2, title: "Create your center", text: "Register in a minute. Add branches, set your brand color and invite your teachers." },
  { icon: KeyRound, title: "Invite students", text: "Share your invite code or add accounts yourself. Organise students into groups with a teacher and schedule." },
  { icon: Users, title: "Teach with data", text: "Add your own subjects and questions, build tests, unlock lessons for a group, post announcements and see who needs help." },
];

export default async function Home() {
  const user = await getCurrentUser();
  const [subjects, questions, tests] = await Promise.all([
    db.subject.findMany({ where: { centerId: null }, orderBy: { order: "asc" } }),
    db.question.count({ where: { centerId: null } }),
    db.test.count({ where: { centerId: null } }),
  ]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Logo />
          <nav className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            {user ? (
              <ButtonLink href={homeFor(user.role)} size="sm">
                Open {PLATFORM_NAME} <ArrowRight className="size-4" />
              </ButtonLink>
            ) : (
              <>
                <ButtonLink href="/login" variant="ghost" size="sm">Log in</ButtonLink>
                <ButtonLink href="/register" size="sm">Join with a code</ButtonLink>
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
              <span className="size-1.5 rounded-full bg-success" /> Built for learning centers
            </span>
            <h1 className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-[1.08] font-extrabold tracking-tight sm:text-6xl">
              One platform for <span className="text-brand">every subject</span> your center teaches
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
              {PLATFORM_NAME} gives every learning center its own learning platform — mathematics, languages, sciences, history and anything else you teach — with a question bank, timed tests, lesson roadmaps, vocabulary, a library, top universities and an AI tutor.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {user ? (
                <ButtonLink href={homeFor(user.role)} size="lg">Continue learning <ArrowRight className="size-4" /></ButtonLink>
              ) : (
                <>
                  <ButtonLink href="/register" size="lg">I&apos;m a student</ButtonLink>
                  <ButtonLink href="/register/center" size="lg" variant="outline">I run a learning center</ButtonLink>
                </>
              )}
            </div>
            <div className="mx-auto mt-12 flex max-w-3xl flex-wrap justify-center gap-2">
              {subjects.map((s) => (
                <span key={s.id} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pr-3.5 pl-1 text-sm font-semibold shadow-card">
                  <SubjectIcon icon={s.icon} color={s.color} size={26} /> {s.name}
                </span>
              ))}
              <span className="flex items-center rounded-full border border-dashed border-line-strong px-3.5 text-sm font-semibold text-muted">+ your own subjects</span>
            </div>
            <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3">
              {[
                [subjects.length.toLocaleString(), "ready-made subjects"],
                [questions.toLocaleString(), "practice questions"],
                [tests.toLocaleString(), "timed tests"],
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
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight">Everything a learning center needs</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-muted">Students practise, test and review in one place. Teachers see exactly where to help.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                <div className="grid size-11 place-items-center rounded-xl bg-brand-soft text-brand">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.3fr] lg:items-center">
            <div>
              <p className="text-sm font-bold tracking-wider text-brand uppercase">For learning centers</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Your center, your platform</h2>
              <p className="mt-3 text-muted">
                Each center gets a private space with its own subjects, students, groups, branches, content and brand color. Ready-made subjects are included; anything you add is visible only to your students.
              </p>
              <ButtonLink href="/register/center" className="mt-6">
                Create your center <ArrowRight className="size-4" />
              </ButtonLink>
            </div>
            <ol className="space-y-3">
              {CENTER_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-bg p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand font-display font-extrabold text-white">{i + 1}</span>
                  <div>
                    <h3 className="flex items-center gap-2 font-display font-bold">
                      <s.icon className="size-4 text-brand" /> {s.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">Ready to start?</h2>
          <p className="mt-2 text-muted">Students join with the invite code from their center.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/register" size="lg">Join with a code</ButtonLink>
            <ButtonLink href="/login" size="lg" variant="outline">Log in</ButtonLink>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} {PLATFORM_NAME}</span>
          <span>Built for learning centers in Uzbekistan and beyond.</span>
        </div>
      </footer>
    </div>
  );
}
