import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireCandidate } from "@/lib/mock/session";
import { publicTest, readAnswers, readContent, readWriting, sectionKeys } from "@/lib/mock/tests";
import { keyText, markAll, SPEAKING_CRITERIA, WRITING_CRITERIA, type SpeakingMarks, type WritingMarks } from "@/lib/mock/score";
import { wordCount } from "@/lib/mock/format";
import { bandText } from "@/lib/mock/bands";
import { MockShell } from "@/components/mock/mock-header";
import { ReviewQuestions } from "@/components/mock/review";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { fmt } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.mock.resultTitle) as () => Promise<Metadata>;

function parseJson<T>(json: string | null): T | null {
  try {
    return json ? (JSON.parse(json) as T) : null;
  } catch {
    return null;
  }
}

export default async function MockResult({ params }: PageProps<"/mock/result/[id]">) {
  const { id } = await params;
  const candidate = await requireCandidate();
  const { t, date } = await getI18n();
  const M = t.mock;
  const attempt = await db.mockAttempt.findUnique({ where: { id }, include: { test: true } });
  if (!attempt || attempt.candidateId !== candidate.id || attempt.section !== "DONE") notFound();
  const content = readContent(attempt.test.content);
  const pub = publicTest(content);
  const keys = sectionKeys(content);
  const answers = readAnswers(attempt.answers);
  const writing = readWriting(attempt.writing);
  const l = markAll(keys.listening.key, answers.L);
  const r = markAll(keys.reading.key, answers.R);
  const keyTexts = (key: typeof keys.listening.key) => Object.fromEntries(Object.entries(key).map(([n, k]) => [n, keyText(k)]));
  const wMarks = attempt.released ? parseJson<WritingMarks>(attempt.writingMarks) : null;
  const sMarks = attempt.released ? parseJson<SpeakingMarks>(attempt.speakingMarks) : null;

  const tiles = [
    { label: M.listening, band: attempt.listeningBand, note: fmt(M.raw, { n: l.raw, total: l.total }) },
    { label: M.reading, band: attempt.readingBand, note: fmt(M.raw, { n: r.raw, total: r.total }) },
    { label: M.writing, band: attempt.released ? attempt.writingBand : null, note: attempt.released ? "" : M.writingPending },
    { label: M.speaking, band: attempt.released ? attempt.speakingBand : null, note: attempt.released ? "" : M.speakingPending },
  ];

  return (
    <MockShell centerName={candidate.center.name} accent={candidate.center.accent} candidate={candidate}>
      <Link href="/mock/home" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <ArrowLeft className="size-4" /> {M.backHome}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold tracking-wider text-brand uppercase">{M.resultTitle}</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">{attempt.test.title}</h1>
          <p className="mt-1 text-muted">
            {fmt(M.resultFor, { name: candidate.name, number: candidate.number })} · {date(attempt.finishedAt ?? attempt.startedAt)}
          </p>
        </div>
        <div className="rounded-2xl bg-brand px-5 py-3 text-center text-white">
          <div className="text-xs font-bold tracking-wider uppercase opacity-80">{M.overall}</div>
          <div className="font-display text-4xl font-extrabold tabular-nums">{attempt.released ? bandText(attempt.overallBand) : "—"}</div>
        </div>
      </div>
      {!attempt.released && <p className="mt-3 text-sm text-muted">{M.overallPending}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <div className="text-sm font-semibold text-muted">{tile.label}</div>
            <div className="font-display text-3xl font-extrabold tabular-nums">{bandText(tile.band)}</div>
            {tile.note && <div className="mt-1 text-xs text-muted">{tile.note}</div>}
          </div>
        ))}
      </div>

      {(wMarks || sMarks) && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {wMarks && (
            <Card>
              <CardHeader title={`${M.writing} · ${bandText(attempt.writingBand)}`} />
              <CardBody className="space-y-3 text-sm">
                {(["t1", "t2"] as const).map((task, i) => (
                  <div key={task}>
                    <p className="font-semibold">{i === 0 ? M.task1 : M.task2}</p>
                    <ul className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted">
                      {WRITING_CRITERIA.map((c) => (
                        <li key={c} className="flex justify-between gap-2">
                          <span>{M.criteria[c]}</span>
                          <b className="text-ink tabular-nums">{wMarks[task][c]}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {wMarks.comment && <p className="rounded-xl bg-surface-2 p-3 whitespace-pre-line">{wMarks.comment}</p>}
              </CardBody>
            </Card>
          )}
          {sMarks && (
            <Card>
              <CardHeader title={`${M.speaking} · ${bandText(attempt.speakingBand)}`} />
              <CardBody className="space-y-3 text-sm">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted">
                  {SPEAKING_CRITERIA.map((c) => (
                    <li key={c} className="flex justify-between gap-2">
                      <span>{M.criteria[c]}</span>
                      <b className="text-ink tabular-nums">{sMarks[c]}</b>
                    </li>
                  ))}
                </ul>
                {sMarks.comment && <p className="rounded-xl bg-surface-2 p-3 whitespace-pre-line">{sMarks.comment}</p>}
              </CardBody>
            </Card>
          )}
        </div>
      )}

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader title={`${M.reviewTitle} · ${M.listening}`} />
          <CardBody>
            <ReviewQuestions
              parts={pub.listening.map((p) => ({ groups: p.groups, from: p.from, to: p.to, script: p.script }))}
              answers={answers.L}
              correct={l.correct}
              keyText={keyTexts(keys.listening.key)}
              labels={{ part: M.part, transcript: M.transcript }}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={`${M.reviewTitle} · ${M.reading}`} />
          <CardBody>
            <ReviewQuestions
              parts={pub.reading.map((p) => ({ groups: p.groups, from: p.from, to: p.to, title: p.title }))}
              answers={answers.R}
              correct={r.correct}
              keyText={keyTexts(keys.reading.key)}
              labels={{ part: M.part, transcript: M.transcript }}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={`${M.reviewTitle} · ${M.writing}`} />
          <CardBody className="grid gap-4 lg:grid-cols-2">
            {(["1", "2"] as const).map((k, i) => (
              <div key={k}>
                <p className="font-semibold">
                  {i === 0 ? M.task1 : M.task2} · <span className="font-normal text-muted">{fmt(M.words, { n: wordCount(writing[k]) })}</span>
                </p>
                <p className="mt-2 rounded-xl border border-line bg-surface-2 p-3 text-sm whitespace-pre-line">{writing[k] || "—"}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </MockShell>
  );
}
