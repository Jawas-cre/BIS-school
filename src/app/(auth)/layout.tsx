import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { CheckCircle2 } from "lucide-react";
import { PLATFORM_NAME } from "@/lib/brand";

const POINTS = [
  "A full SAT question bank with step-by-step explanations",
  "Bluebook-style timed mock tests with instant score reports",
  "A roadmap with video lessons that unlocks topic by topic",
  "Vocabulary trainer, library, top universities and an AI tutor",
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-brand p-12 text-white lg:flex lg:flex-col">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, rgb(255 255 255 / .25), transparent 70%), radial-gradient(50% 60% at 90% 90%, rgb(0 0 0 / .25), transparent 70%)",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-white/15 font-display text-lg font-extrabold">B</span>
          <span className="font-display text-lg font-extrabold">{PLATFORM_NAME}</span>
        </div>
        <div className="relative mt-auto max-w-lg">
          <h2 className="font-display text-4xl leading-tight font-extrabold tracking-tight">
            Every student in your center, on the road to 1600.
          </h2>
          <ul className="mt-8 space-y-3 text-[15px] text-white/90">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-white/80" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-12 text-sm text-white/60">Trusted by learning centers across Central Asia.</p>
      </aside>
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">{children}</div>
      </main>
    </div>
  );
}
