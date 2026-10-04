"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, CheckCircle2, FileAudio, ImageIcon, Loader2, Play, Square, Trash2, Upload } from "lucide-react";
import { parseQuestions, parseScript, passageParagraphs, type MockContent } from "@/lib/mock/format";
import { QuestionGroups } from "@/components/mock/exam/questions";
import { ListeningPlayer } from "@/components/mock/exam/listening-player";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { fmt } from "@/lib/i18n/format";
import { saveMockTest } from "../../actions";

type Files = Record<string, { name: string; url: string }>;
type Props = { id: string; initial: { title: string; module: string; content: MockContent }; files: Files };

const PREVIEW_STYLE = {
  "--ex-bg": "var(--surface)",
  "--ex-fg": "var(--ink)",
  "--ex-muted": "var(--muted)",
  "--ex-line": "var(--line)",
  "--ex-line-strong": "var(--line-strong)",
  "--ex-accent": "var(--brand)",
  "--ex-accent-soft": "var(--brand-soft)",
  "--ex-hover": "var(--surface-2)",
} as React.CSSProperties;

async function upload(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/mock/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data as { id: string; url: string; name: string };
}

function UploadButton({ accept, label, onDone }: { accept: string; label: string; onDone: (f: { id: string; url: string; name: string }) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <input
        ref={input}
        type="file"
        accept={accept}
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            onDone(await upload(file));
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} {label}
      </Button>
      {error && <span className="mt-1 text-xs text-danger">{error}</span>}
    </span>
  );
}

/** Parse errors and the live preview of a part's questions. */
function QuestionsPreview({ source, first, A }: { source: string; first: number; A: ReturnType<typeof useT>["mockAdmin"] }) {
  const parsed = useMemo(() => parseQuestions(source, first), [source, first]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const count = parsed.next - first;
  return (
    <div className="space-y-3">
      <p className={cn("flex items-center gap-1.5 text-sm font-semibold", parsed.errors.length ? "text-danger" : "text-success")}>
        {parsed.errors.length ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
        {count ? fmt(A.questionsRange, { from: first, to: parsed.next - 1, n: count }) : A.noQuestionsYet}
      </p>
      {parsed.errors.map((e, i) => (
        <p key={i} className="rounded-lg bg-danger-soft px-3 py-1.5 text-xs text-danger">
          {fmt(A.lineError, { line: e.line, message: e.message })}
        </p>
      ))}
      <div style={PREVIEW_STYLE} className="rounded-xl border border-line bg-surface p-4 text-[15px]">
        <QuestionGroups
          groups={parsed.groups}
          props={{ answers, setAnswer: (n, v) => setAnswers((a) => ({ ...a, [n]: v })), flags: new Set(), toggleFlag: () => {}, focus: () => {}, current: null }}
        />
        {!parsed.groups.length && <p className="text-sm text-muted">{A.previewEmpty}</p>}
      </div>
    </div>
  );
}

function ScriptPreview({ script, A }: { script: string; A: ReturnType<typeof useT>["mockAdmin"] }) {
  const [playing, setPlaying] = useState(false);
  const player = useRef<ListeningPlayer | null>(null);
  useEffect(() => () => player.current?.stop(), []);
  const lines = parseScript(script);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!lines.length}
      onClick={() => {
        if (playing) {
          player.current?.stop();
          setPlaying(false);
          return;
        }
        player.current = new ListeningPlayer([{ audio: null, script: lines }], { onPart: () => {}, onEnd: () => setPlaying(false), onError: () => setPlaying(false) });
        player.current.start(0);
        setPlaying(true);
      }}
    >
      {playing ? <Square className="size-4" /> : <Play className="size-4" />} {playing ? A.stopListening : A.listenScript}
    </Button>
  );
}

export function TestEditor({ id, initial, files: initialFiles }: Props) {
  const t = useT();
  const A = t.mockAdmin;
  const [title, setTitle] = useState(initial.title);
  const [module, setModule] = useState(initial.module);
  const [content, setContent] = useState<MockContent>(initial.content);
  const [files, setFiles] = useState<Files>(initialFiles);
  const [tab, setTab] = useState<"L" | "R" | "W">("L");
  const [part, setPart] = useState(0);
  const [message, setMessage] = useState<{ ok?: string; error?: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, startSaving] = useTransition();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (fn: (c: MockContent) => void) => {
    setContent((c) => {
      const next = structuredClone(c);
      fn(next);
      return next;
    });
    setDirty(true);
    setMessage(null);
  };
  const addFile = (f: { id: string; url: string; name: string }) => setFiles((x) => ({ ...x, [f.id]: { name: f.name, url: f.url } }));

  // Question numbers run on from the previous parts, as in the exam.
  const firsts = useMemo(() => {
    const starts = (sources: string[]) => {
      const out: number[] = [];
      let n = 1;
      for (const s of sources) {
        out.push(n);
        n = parseQuestions(s, n).next;
      }
      return { starts: out, total: n - 1 };
    };
    return { L: starts(content.listening.map((p) => p.questions)), R: starts(content.reading.map((p) => p.questions)) };
  }, [content]);

  const save = () =>
    startSaving(async () => {
      const res = await saveMockTest(id, JSON.stringify({ title, module, content }));
      setMessage(res);
      if (res?.ok) setDirty(false);
    });

  const parts = tab === "L" ? content.listening.length : tab === "R" ? content.reading.length : content.writing.length;
  const partLabel = (i: number) => (tab === "W" ? (i === 0 ? t.mock.task1 : t.mock.task2) : `${t.mock.part} ${i + 1}`);

  return (
    <div className="space-y-5">
      <div className="sticky top-[6.5rem] z-20 -mx-1 flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card">
        <Field label={A.testTitle} className="min-w-56 flex-1">
          <Input value={title} onChange={(e) => (setTitle(e.target.value), setDirty(true))} maxLength={120} />
        </Field>
        <Field label={A.module}>
          <Select value={module} onChange={(e) => (setModule(e.target.value), setDirty(true))}>
            <option value="ACADEMIC">{t.mock.academic}</option>
            <option value="GENERAL_TRAINING">{t.mock.general}</option>
          </Select>
        </Field>
        <div className="flex items-center gap-3 pb-1 text-sm">
          <span className={cn("font-semibold tabular-nums", firsts.L.total === 40 ? "text-success" : "text-warning")}>L {firsts.L.total}/40</span>
          <span className={cn("font-semibold tabular-nums", firsts.R.total === 40 ? "text-success" : "text-warning")}>R {firsts.R.total}/40</span>
        </div>
        <Button onClick={save} disabled={saving} className="mb-0.5">
          {saving ? <Loader2 className="size-4 animate-spin" /> : null} {saving ? t.common.saving : dirty ? A.saveChanges : A.savedState}
        </Button>
        {message && <p className={cn("w-full text-sm font-semibold", message.error ? "text-danger" : "text-success")}>{message.error ?? message.ok}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {(["L", "R", "W"] as const).map((k) => (
          <button key={k} onClick={() => (setTab(k), setPart(0))} className={cn("rounded-xl px-3 py-1.5 text-sm font-bold", tab === k ? "bg-brand text-white" : "text-ink-2 hover:bg-surface-2")}>
            {k === "L" ? t.mock.listening : k === "R" ? t.mock.reading : t.mock.writing}
          </button>
        ))}
        <span className="mx-2 h-6 w-px bg-line" />
        {Array.from({ length: parts }, (_, i) => (
          <button key={i} onClick={() => setPart(i)} className={cn("rounded-xl px-3 py-1.5 text-sm font-semibold", part === i ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2")}>
            {partLabel(i)}
          </button>
        ))}
      </div>

      {tab === "L" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-line p-4">
              <p className="flex items-center gap-2 font-semibold">
                <FileAudio className="size-4 text-brand" /> {A.recording}
              </p>
              {content.listening[part].audioId ? (
                <div className="mt-3 space-y-2">
                  <p className="text-sm">{files[content.listening[part].audioId!]?.name ?? A.uploadedFile}</p>
                  <audio controls src={files[content.listening[part].audioId!]?.url} className="w-full" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => update((c) => void (c.listening[part].audioId = null))}>
                    <Trash2 className="size-4" /> {A.removeRecording}
                  </Button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-muted">{A.noRecording}</p>
                  <UploadButton accept="audio/*" label={A.uploadRecording} onDone={(f) => (addFile(f), update((c) => void (c.listening[part].audioId = f.id)))} />
                </div>
              )}
            </div>
            <Field label={A.script} hint={content.listening[part].audioId ? A.scriptHintAudio : A.scriptHint}>
              <Textarea
                value={content.listening[part].script ?? ""}
                onChange={(e) => update((c) => void (c.listening[part].script = e.target.value))}
                rows={10}
                className="font-mono text-[13px]"
                placeholder={"Man: Good morning, how can I help you?\nWoman: I'd like to book a course.\n(pause 10)"}
              />
            </Field>
            <ScriptPreview script={content.listening[part].script ?? ""} A={A} />
            <QuestionsEditor value={content.listening[part].questions} onChange={(v) => update((c) => void (c.listening[part].questions = v))} A={A} />
          </div>
          <QuestionsPreview source={content.listening[part].questions} first={firsts.L.starts[part]} A={A} />
        </div>
      )}

      {tab === "R" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4">
            <Field label={A.passageTitle}>
              <Input value={content.reading[part].title} onChange={(e) => update((c) => void (c.reading[part].title = e.target.value))} />
            </Field>
            <Field label={A.passageText} hint={fmt(A.passageHint, { n: passageParagraphs(content.reading[part]).length })}>
              <Textarea value={content.reading[part].text} onChange={(e) => update((c) => void (c.reading[part].text = e.target.value))} rows={14} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!content.reading[part].labels} onChange={(e) => update((c) => void (c.reading[part].labels = e.target.checked))} className="size-4 accent-[var(--brand)]" />
              {A.labelParagraphs}
            </label>
            <QuestionsEditor value={content.reading[part].questions} onChange={(v) => update((c) => void (c.reading[part].questions = v))} A={A} />
          </div>
          <QuestionsPreview source={content.reading[part].questions} first={firsts.R.starts[part]} A={A} />
        </div>
      )}

      {tab === "W" && (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="space-y-4">
            <Field label={A.taskPrompt} hint={A.taskPromptHint}>
              <Textarea value={content.writing[part].prompt} onChange={(e) => update((c) => void (c.writing[part].prompt = e.target.value))} rows={12} />
            </Field>
            <Field label={A.minWordsLabel}>
              <Input type="number" min={0} max={1000} value={content.writing[part].minWords} onChange={(e) => update((c) => void (c.writing[part].minWords = Number(e.target.value) || 0))} className="w-32" />
            </Field>
            <div className="rounded-2xl border border-line p-4">
              <p className="flex items-center gap-2 font-semibold">
                <ImageIcon className="size-4 text-brand" /> {A.picture}
              </p>
              {content.writing[part].imageId ? (
                <div className="mt-3 space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={files[content.writing[part].imageId!]?.url} alt="" className="max-h-72 rounded border border-line bg-white" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => update((c) => void (c.writing[part].imageId = null))}>
                    <Trash2 className="size-4" /> {A.removePicture}
                  </Button>
                </div>
              ) : (
                <div className="mt-3">
                  <UploadButton accept="image/png,image/jpeg,image/gif,image/webp" label={A.uploadPicture} onDone={(f) => (addFile(f), update((c) => void (c.writing[part].imageId = f.id)))} />
                </div>
              )}
            </div>
          </div>
          <div style={PREVIEW_STYLE} className="rounded-xl border border-line bg-surface p-4 text-[15px] whitespace-pre-line">
            {content.writing[part].prompt || <span className="text-muted">{A.previewEmpty}</span>}
            {content.writing[part].imageId && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={files[content.writing[part].imageId!]?.url} alt="" className="mt-3 max-w-full rounded border border-line bg-white" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QuestionsEditor({ value, onChange, A }: { value: string; onChange: (v: string) => void; A: ReturnType<typeof useT>["mockAdmin"] }) {
  return (
    <div className="space-y-2">
      <Field label={A.questions}>
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={16} className="font-mono text-[13px] leading-relaxed" spellCheck={false} />
      </Field>
      <details className="rounded-xl border border-line p-3 text-sm">
        <summary className="cursor-pointer font-semibold">{A.formatHelp}</summary>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-surface-2 p-3 text-xs leading-relaxed whitespace-pre">{A.formatExample}</pre>
      </details>
    </div>
  );
}
