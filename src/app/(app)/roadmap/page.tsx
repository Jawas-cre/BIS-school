import type { Metadata } from "next";
import Link from "next/link";
import { BookText, Check, Lock, PlayCircle, Unlock } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { roadmapFor } from "@/lib/roadmap";
import { enrolledSubjectIds, visibleSubjects } from "@/lib/subjects";
import { EmptyState, PageHeader, Progress } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { SubjectIcon } from "@/components/subject-icon";
import { cn, pct } from "@/lib/utils";

export const metadata: Metadata = { title: "Roadmap" };

export default async function RoadmapPage({ searchParams }: PageProps<"/roadmap">) {
  const user = await requireStudentArea();
  const sp = await searchParams;
  const subjects = await visibleSubjects(user.centerId);
  const enrolled = enrolledSubjectIds(user);
  const ordered = [...subjects].sort((a, b) => Number(enrolled.includes(b.id)) - Number(enrolled.includes(a.id)));
  const subject = ordered.find((s) => s.id === sp.subject) ?? ordered[0];
  if (!subject) return <EmptyState title="No subjects yet">Your center hasn&apos;t added any subjects.</EmptyState>;

  const units = await roadmapFor(user, subject.id);
  const done = units.filter((u) => u.completed).length;
  const current = units.find((u) => u.unlocked && !u.completed);
  const group = user.memberships.find((m) => m.group.subjectId === subject.id)?.group;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Roadmap" subtitle="A step-by-step course for each subject. Watch the lesson, read the notes, then pass the quiz to unlock the next unit." />

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {ordered.map((s) => (
          <Link
            key={s.id}
            href={`/roadmap?subject=${s.id}`}
            className={cn("flex shrink-0 items-center gap-2 rounded-2xl border bg-surface py-1.5 pr-4 pl-1.5 text-sm font-semibold shadow-card", s.id === subject.id ? "border-brand ring-4 ring-brand-soft" : "border-line hover:border-line-strong")}
          >
            <SubjectIcon icon={s.icon} color={s.color} size={30} /> {s.name}
            {enrolled.includes(s.id) && <span className="size-1.5 rounded-full bg-brand" title="Your subject" />}
          </Link>
        ))}
      </div>

      <div className="mb-8 rounded-2xl border border-line bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <SubjectIcon icon={subject.icon} color={subject.color} size={48} />
          <div className="min-w-0 flex-1">
            <div className="font-display text-xl font-extrabold">{subject.name}</div>
            <div className="text-sm text-muted">{group ? `${group.name}${group.teacher ? ` · ${group.teacher.name}` : ""}` : subject.description}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-extrabold" style={{ color: subject.color }}>{pct(done, units.length)}%</div>
            <div className="text-xs text-muted">{done} of {units.length} units</div>
          </div>
        </div>
        <Progress value={pct(done, units.length)} className="mt-4" />
      </div>

      {units.length === 0 ? (
        <EmptyState icon={<BookText className="size-5" />} title="No lessons yet">Your teachers haven&apos;t published a roadmap for {subject.name} yet. You can still practise in the Question Bank.</EmptyState>
      ) : (
        <ol className="relative space-y-3">
          <span aria-hidden className="absolute top-6 bottom-6 left-[27px] w-0.5 bg-line sm:left-[31px]" />
          {units.map((u) => {
            const isCurrent = current?.id === u.id;
            const body = (
              <div className={cn("relative flex items-center gap-4 rounded-2xl border bg-surface p-4 shadow-card transition-colors sm:p-5", isCurrent ? "border-brand ring-4 ring-brand-soft" : "border-line", u.unlocked ? "hover:border-line-strong" : "opacity-60")}>
                <span
                  className={cn("relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 sm:size-12", u.completed && "border-success bg-success text-white", !u.completed && u.unlocked && "border-brand bg-surface text-brand", !u.unlocked && "border-line-strong bg-surface-2 text-muted")}
                >
                  {u.completed ? <Check className="size-5" /> : u.unlocked ? <span className="font-display font-extrabold">{u.index + 1}</span> : <Lock className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-muted">UNIT {u.index + 1}</span>
                    {u.topic && <Badge>{u.topic.name}</Badge>}
                    {u.teacherUnlocked && !u.completed && <Badge tone="success"><Unlock className="size-3" /> Unlocked by teacher</Badge>}
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
            return <li key={u.id}>{u.unlocked ? <Link href={`/roadmap/${u.id}`} className="block">{body}</Link> : body}</li>;
          })}
        </ol>
      )}
    </div>
  );
}
