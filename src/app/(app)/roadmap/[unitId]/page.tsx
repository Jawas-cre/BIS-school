import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, Lock, PlayCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea, visibleTo } from "@/lib/auth";
import { roadmapFor } from "@/lib/roadmap";
import { parseChoices } from "@/lib/sat";
import { shuffleSeeded } from "@/lib/shuffle";
import { dayKey, toEmbedUrl } from "@/lib/utils";
import { Markdown } from "@/components/markdown";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { UnitQuiz } from "./unit-quiz";

export const metadata: Metadata = { title: "Roadmap unit" };

export default async function UnitPage({ params }: PageProps<"/roadmap/[unitId]">) {
  const user = await requireStudentArea();
  const { unitId } = await params;
  const units = await roadmapFor(user);
  const index = units.findIndex((u) => u.id === unitId);
  if (index < 0) notFound();
  const unit = units[index];
  const next = units[index + 1];
  const prev = units[index - 1];

  if (!unit.unlocked) {
    return (
      <div className="mx-auto max-w-xl pt-10">
        <EmptyState
          icon={<Lock className="size-5" />}
          title="This unit is locked"
          action={<ButtonLink href="/roadmap">Back to roadmap</ButtonLink>}
        >
          Complete “{prev?.title}” first, or ask your teacher to unlock it for your group.
        </EmptyState>
      </div>
    );
  }

  // Five quiz questions from the unit's skill; the pick changes daily so retakes differ.
  const pool = unit.skill
    ? await db.question.findMany({
        where: { skill: unit.skill, ...visibleTo(user.centerId) },
        select: { id: true, section: true, type: true, passage: true, stem: true, choices: true },
      })
    : [];
  const quiz = shuffleSeeded(pool, `${user.id}:${unit.id}:${dayKey()}`)
    .slice(0, 5)
    .map((q) => ({ ...q, choices: parseChoices(q.choices) }));
  const embed = toEmbedUrl(unit.videoUrl);

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/roadmap" className="hover:text-ink">
          Roadmap
        </Link>
        <ChevronRight className="size-3.5" />
        <span>Unit {index + 1}</span>
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={unit.section === "MATH" ? "warning" : "brand"}>{unit.section === "MATH" ? "Math" : "Reading & Writing"}</Badge>
        {unit.completed && <Badge tone="success">Completed{unit.quizScore !== null ? ` · ${unit.quizScore}%` : ""}</Badge>}
      </div>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">{unit.title}</h1>
      <p className="mt-1 text-[15px] text-muted">{unit.summary}</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        {embed ? (
          <div className="aspect-video bg-black">
            <iframe
              src={embed}
              title={unit.title}
              className="size-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-5 py-4 text-sm text-muted">
            <PlayCircle className="size-5" /> Your teacher hasn&apos;t added a video lesson for this unit yet — the notes below cover everything.
          </div>
        )}
        <div className="p-5 sm:p-8">
          <Markdown>{unit.notes}</Markdown>
        </div>
      </div>

      <div className="mt-6">
        <UnitQuiz
          unitId={unit.id}
          questions={quiz}
          completed={unit.completed}
          nextHref={next ? `/roadmap/${next.id}` : null}
        />
      </div>

      <div className="mt-8 flex justify-between">
        {prev ? (
          <ButtonLink href={`/roadmap/${prev.id}`} variant="ghost">
            <ChevronLeft className="size-4" /> {prev.title}
          </ButtonLink>
        ) : (
          <span />
        )}
        {next && next.unlocked && (
          <ButtonLink href={`/roadmap/${next.id}`} variant="ghost">
            {next.title} <ChevronRight className="size-4" />
          </ButtonLink>
        )}
      </div>
    </div>
  );
}
