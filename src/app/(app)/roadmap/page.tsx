import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Check, Lock, PlayCircle, BookText, Unlock } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { roadmapFor } from "@/lib/roadmap";
import { PageHeader, Progress } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { cn, pct } from "@/lib/utils";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage() {
  const user = await requireStudentArea();
  const units = await roadmapFor(user);
  const done = units.filter((u) => u.completed).length;
  const current = units.find((u) => u.unlocked && !u.completed);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={user.group ? `${user.group.name} roadmap` : "Your roadmap"}
        title="Roadmap"
        subtitle="A structured path through every SAT skill. Watch the lesson, read the notes, then pass the quiz to unlock the next unit."
      />

      <div className="mb-8 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-ink">
            {done} of {units.length} units complete
          </span>
          <span className="font-display text-xl font-extrabold text-brand">{pct(done, units.length)}%</span>
        </div>
        <Progress value={pct(done, units.length)} className="mt-3" />
      </div>

      <ol className="relative space-y-3">
        <span aria-hidden className="absolute top-6 bottom-6 left-[27px] w-0.5 bg-line sm:left-[31px]" />
        {units.map((u, i) => {
          const isCurrent = current?.id === u.id;
          const Icon = u.section === "MATH" ? Calculator : BookText;
          const body = (
            <div
              className={cn(
                "relative flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-card transition-colors sm:p-5",
                isCurrent ? "border-brand ring-4 ring-brand-soft" : "border-line",
                u.unlocked ? "hover:border-line-strong" : "opacity-60",
              )}
            >
              <span
                className={cn(
                  "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 sm:size-12",
                  u.completed && "border-success bg-success text-white",
                  !u.completed && u.unlocked && "border-brand bg-surface text-brand",
                  !u.unlocked && "border-line-strong bg-surface-2 text-muted",
                )}
              >
                {u.completed ? <Check className="size-5" /> : u.unlocked ? <Icon className="size-5" /> : <Lock className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-muted">UNIT {i + 1}</span>
                  <Badge tone={u.section === "MATH" ? "warning" : "brand"}>{u.section === "MATH" ? "Math" : "Reading & Writing"}</Badge>
                  {u.teacherUnlocked && !u.completed && (
                    <Badge tone="success">
                      <Unlock className="size-3" /> Unlocked by teacher
                    </Badge>
                  )}
                  {u.videoUrl && <PlayCircle className="size-4 text-muted" aria-label="Has video" />}
                </div>
                <div className="mt-1 font-display text-[16px] font-bold text-ink">{u.title}</div>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted">{u.summary}</p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                {u.completed ? (
                  <span className="text-sm font-bold text-success">{u.quizScore !== null ? `${u.quizScore}%` : "Done"}</span>
                ) : isCurrent ? (
                  <span className="rounded-lg bg-brand px-3 py-1.5 text-sm font-bold text-white">Start</span>
                ) : u.unlocked ? (
                  <span className="text-sm font-semibold text-brand">Open</span>
                ) : (
                  <span className="text-sm text-muted">Locked</span>
                )}
              </div>
            </div>
          );
          return (
            <li key={u.id}>
              {u.unlocked ? (
                <Link href={`/roadmap/${u.id}`} className="block">
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
