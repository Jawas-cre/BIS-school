import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { MOCK_ONLY } from "@/lib/app-mode";
import { requireStaff } from "@/lib/auth";
import { readContent, readWriting, mediaUrl } from "@/lib/mock/tests";
import { SPEAKING_CRITERIA, WRITING_CRITERIA, type SpeakingMarks, type WritingMarks } from "@/lib/mock/score";
import { wordCount } from "@/lib/mock/format";
import { bandText } from "@/lib/mock/bands";
import type { AiWriting } from "@/lib/mock/ai-mark";
import { aiSettings } from "@/lib/ai";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/form";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/ui/submit-button";
import { RichText } from "@/components/mock/exam/questions";
import { askAiAgain, saveMarks } from "../../actions";
import { fmt } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.mockAdmin.markTitle) as () => Promise<Metadata>;

function parse<T>(json: string | null): T | null {
  try {
    return json ? (JSON.parse(json) as T) : null;
  } catch {
    return null;
  }
}

const BANDS = Array.from({ length: 19 }, (_, i) => i / 2);

export default async function MarkAttempt({ params }: PageProps<"/mock/admin/results/[id]">) {
  const { id } = await params;
  const staff = await requireStaff();
  const { t, date } = await getI18n();
  const A = t.mockAdmin;
  const M = t.mock;
  const attempt = await db.mockAttempt.findFirst({ where: { id, centerId: staff.centerId, section: "DONE" }, include: { candidate: true, test: true } });
  if (!attempt) notFound();
  const tasks = readContent(attempt.test.content).writing;
  const writing = readWriting(attempt.writing);
  const ai = parse<AiWriting>(attempt.writingAi);
  const wMarks = parse<WritingMarks>(attempt.writingMarks);
  const sMarks = parse<SpeakingMarks>(attempt.speakingMarks);
  const aiOn = (await aiSettings()).provider !== "off";
  // The marker starts from their own saved marks, else the AI's estimate.
  const start = wMarks ?? (ai && !ai.error ? ai : null);

  const bandSelect = (name: string, value: number | undefined) => (
    <Select name={name} defaultValue={value === undefined ? "" : String(value)} className="h-9 w-[5.5rem] shrink-0 pl-3 text-sm">
      <option value="">—</option>
      {BANDS.map((b) => (
        <option key={b} value={b}>
          {b}
        </option>
      ))}
    </Select>
  );

  return (
    <div className="space-y-6">
      <Link href="/mock/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <ArrowLeft className="size-4" /> {A.navResults}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">{attempt.candidate.name}</h1>
          <p className="text-muted">
            {M.candidateNo} {attempt.candidate.number} · {attempt.test.title} · {date(attempt.finishedAt ?? attempt.startedAt)}
          </p>
        </div>
        <div className="flex gap-2 text-center">
          {[
            [M.listening, attempt.listeningBand, attempt.listeningRaw],
            [M.reading, attempt.readingBand, attempt.readingRaw],
            [M.writing, attempt.writingBand, null],
            [M.speaking, attempt.speakingBand, null],
            [M.overall, attempt.overallBand, null],
          ].map(([label, band, raw]) => (
            <div key={String(label)} className="rounded-xl border border-line bg-surface px-3 py-2">
              <div className="text-[11px] font-semibold text-muted">{label}</div>
              <div className="font-display text-xl font-extrabold tabular-nums">{bandText(band as number | null)}</div>
              {raw !== null && <div className="text-[11px] text-muted tabular-nums">{raw}/40</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {(["1", "2"] as const).map((k, i) => (
          <Card key={k}>
            <CardHeader title={`${i === 0 ? M.task1 : M.task2} · ${fmt(M.words, { n: wordCount(writing[k]) })}`} subtitle={fmt(A.minWords, { n: tasks[i].minWords })} />
            <CardBody className="space-y-3">
              <details className="rounded-xl border border-line p-3 text-sm">
                <summary className="cursor-pointer font-semibold">{A.taskPrompt}</summary>
                <div className="mt-2 whitespace-pre-line text-muted">
                  <RichText text={tasks[i].prompt} />
                </div>
                {tasks[i].imageId && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(tasks[i].imageId!)} alt="" className="mt-2 max-w-full rounded border border-line bg-white" />
                )}
              </details>
              <p className="rounded-xl bg-surface-2 p-3 text-sm leading-relaxed whitespace-pre-line">{writing[k] || "—"}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="size-4 text-brand" /> {A.aiTitle}
            </span>
          }
          subtitle={A.aiSubtitle}
          action={
            aiOn ? (
              <form action={askAiAgain.bind(null, attempt.id)}>
                <SubmitButton variant="outline" size="sm" pendingText={A.aiWorking}>
                  {ai ? A.aiAgain : A.aiAsk}
                </SubmitButton>
              </form>
            ) : null
          }
        />
        <CardBody className="text-sm">
          {!aiOn ? (
            <p className="text-muted">{MOCK_ONLY ? A.aiOffMock : A.aiOff}</p>
          ) : !ai ? (
            <p className="text-muted">{A.aiPending}</p>
          ) : ai.error ? (
            <p className="rounded-xl bg-danger-soft p-3 text-danger">{fmt(A.aiError, { error: ai.error })}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(["t1", "t2"] as const).map((task, i) => (
                <div key={task} className="space-y-2">
                  <p className="font-semibold">
                    {i === 0 ? M.task1 : M.task2}:{" "}
                    {WRITING_CRITERIA.map((c) => `${c} ${ai[task][c]}`).join(" · ")}
                  </p>
                  <p className="text-muted whitespace-pre-line">{i === 0 ? ai.feedback1 : ai.feedback2}</p>
                </div>
              ))}
              {ai.model && <p className="text-xs text-muted md:col-span-2">{fmt(A.aiModel, { model: ai.model })}</p>}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={A.marksTitle} subtitle={A.marksSubtitle} />
        <CardBody>
          <ActionForm action={saveMarks.bind(null, attempt.id)} submitLabel={A.saveMarks}>
            <div className="grid gap-6 lg:grid-cols-2">
              <fieldset className="space-y-3">
                <legend className="font-display font-bold">{M.writing}</legend>
                {(["t1", "t2"] as const).map((task, i) => (
                  <div key={task}>
                    <p className="mb-1.5 text-sm font-semibold">{i === 0 ? M.task1 : M.task2}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {WRITING_CRITERIA.map((c) => (
                        <label key={c} className="flex items-center justify-between gap-2 rounded-lg border border-line px-2 py-1 text-xs">
                          <span>{M.criteria[c]}</span>
                          {bandSelect(`${task}_${c}`, start?.[task]?.[c])}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <Field label={A.commentWriting}>
                  <Textarea name="wComment" rows={4} defaultValue={wMarks?.comment ?? ([ai?.feedback1 && `Task 1: ${ai.feedback1}`, ai?.feedback2 && `Task 2: ${ai.feedback2}`].filter(Boolean).join("\n\n") || "")} />
                </Field>
              </fieldset>
              <fieldset className="space-y-3">
                <legend className="font-display font-bold">{M.speaking}</legend>
                <p className="text-sm text-muted">{A.speakingHint}</p>
                <div className="grid grid-cols-2 gap-2">
                  {SPEAKING_CRITERIA.map((c) => (
                    <label key={c} className="flex items-center justify-between gap-2 rounded-lg border border-line px-2 py-1 text-xs">
                      <span>{M.criteria[c]}</span>
                      {bandSelect(`s_${c}`, sMarks?.[c])}
                    </label>
                  ))}
                </div>
                <Field label={A.commentSpeaking}>
                  <Textarea name="sComment" rows={4} defaultValue={sMarks?.comment ?? ""} />
                </Field>
              </fieldset>
            </div>
            <label className="flex items-start gap-2 rounded-xl border border-line p-3 text-sm">
              <input type="checkbox" name="release" defaultChecked={attempt.released} className="mt-0.5 size-4 accent-[var(--brand)]" />
              <span>
                <span className="block font-semibold">{A.release}</span>
                <span className="block text-muted">{A.releaseHint}</span>
              </span>
            </label>
          </ActionForm>
        </CardBody>
      </Card>
    </div>
  );
}
