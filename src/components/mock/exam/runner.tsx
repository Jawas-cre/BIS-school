"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, CircleHelp, EyeOff, Headphones, Play, Settings, Volume2, X } from "lucide-react";
import type { PublicTest } from "@/lib/mock/tests";
import type { Group } from "@/lib/mock/format";
import { wordCount } from "@/lib/mock/format";
import { cn } from "@/lib/utils";
import { answeredNumbers, QuestionGroups, RichText, type AnswerProps } from "./questions";
import { ListeningPlayer, soundCheck } from "./listening-player";
import { ReadingPassage } from "./reading-passage";

// The computer-delivered IELTS test screen: Listening, then Reading, then Writing, each timed by the
// server. Answers are saved as they're typed, so a reload or a lost connection loses nothing.
// The exam itself is in English, as on test day.

type Section = "LISTENING" | "READING" | "WRITING" | "DONE";
type Answers = Record<string, string>;
type Props = {
  attemptId: string;
  candidate: { name: string; number: string };
  title: string;
  test: PublicTest;
  initial: { section: string; endsAt: number | null; now: number; answers: { L: Answers; R: Answers }; writing: Record<"1" | "2", string> };
};

const CONTRAST = {
  standard: { "--ex-bg": "#ffffff", "--ex-fg": "#141414", "--ex-muted": "#5b5b5b", "--ex-line": "#dcdcdc", "--ex-line-strong": "#8c8c8c", "--ex-accent": "#1f4fd1", "--ex-accent-soft": "#e9f0ff", "--ex-hover": "#f4f5f7", "--ex-panel": "#f1f2f4", "--ex-mark": "#fff176" },
  inverse: { "--ex-bg": "#000000", "--ex-fg": "#ffffff", "--ex-muted": "#c9c9c9", "--ex-line": "#3a3a3a", "--ex-line-strong": "#a3a3a3", "--ex-accent": "#7fb0ff", "--ex-accent-soft": "#0f2346", "--ex-hover": "#1b1b1b", "--ex-panel": "#121212", "--ex-mark": "#6b5d00" },
  yellow: { "--ex-bg": "#000000", "--ex-fg": "#ffe14d", "--ex-muted": "#e6cc45", "--ex-line": "#3f3a1a", "--ex-line-strong": "#c9b13a", "--ex-accent": "#ffe14d", "--ex-accent-soft": "#2e2905", "--ex-hover": "#1d1a05", "--ex-panel": "#100e02", "--ex-mark": "#6b5d00" },
} as const;
const FONT = { standard: 16, large: 19, xl: 22 } as const;
type Prefs = { contrast: keyof typeof CONTRAST; font: keyof typeof FONT };

function stored<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function timeLeft(ms: number) {
  if (ms <= 0) return "0 minutes left";
  // A second's slack, so a fresh 60-minute section doesn't start at "61 minutes left".
  const minutes = Math.ceil((ms - 1000) / 60_000);
  if (ms < 120_000) {
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} left`;
  }
  return `${minutes} minutes left`;
}

const noSubscribe = () => () => {};

/** The exam screen keeps its place in this browser's storage, so it's drawn in the browser only. */
export function ExamRunner(props: Props) {
  const inBrowser = useSyncExternalStore(noSubscribe, () => true, () => false);
  return inBrowser ? <Runner {...props} /> : <div className="fixed inset-0 bg-white" />;
}

function Runner({ attemptId, candidate, title, test, initial }: Props) {
  const router = useRouter();
  const k = (name: string) => `mock-${attemptId}-${name}`;
  const [section, setSection] = useState<Section>(initial.section as Section);
  const [endsAt, setEndsAt] = useState<number | null>(initial.endsAt);
  const [offset, setOffset] = useState(() => initial.now - Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [answersL, setAnswersL] = useState<Answers>(initial.answers.L);
  const [answersR, setAnswersR] = useState<Answers>(initial.answers.R);
  const [writing, setWriting] = useState(initial.writing);
  const [confirmed, setConfirmed] = useState(() => stored(k("confirmed"), false));
  const [part, setPart] = useState(0);
  const [current, setCurrent] = useState<number | null>(null);
  const [flags, setFlags] = useState<Record<string, number[]>>(() => stored(k("flags"), {}));
  const [prefs, setPrefs] = useState<Prefs>(() => stored("mock-prefs", { contrast: "standard", font: "standard" }));
  const [panel, setPanel] = useState<null | "settings" | "help" | "submit" | "timeup">(null);
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Listening playback
  const [volume, setVolume] = useState(0.8);
  const [playing, setPlaying] = useState<number | null>(null);
  const [audioDone, setAudioDone] = useState(() => stored(k("audioDone"), false));
  const [audioMessage, setAudioMessage] = useState<string | null>(null);
  const player = useRef<ListeningPlayer | null>(null);
  const dirty = useRef(false);

  const running = section !== "DONE" && endsAt !== null;
  const remaining = endsAt === null ? null : endsAt - (now + offset);

  // ─── Server ────────────────────────────────────────────────────────────────
  const payload = useCallback(
    (s: Section) => (s === "WRITING" ? { writing } : s === "LISTENING" ? { answers: answersL } : s === "READING" ? { answers: answersR } : {}),
    [writing, answersL, answersR],
  );
  const call = useCallback(
    async (action: string, extra: object = {}) => {
      const res = await fetch(`/api/mock/attempt/${attemptId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, section, ...extra }),
      });
      if (res.status === 401) {
        router.replace("/mock");
        return null;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { section: Section; endsAt: number | null; now: number };
      setOffset(data.now - Date.now());
      setEndsAt(data.endsAt);
      if (data.section !== section) {
        player.current?.stop();
        setPlaying(null);
        setSection(data.section);
        setPart(0);
        setCurrent(null);
      }
      return data;
    },
    [attemptId, section, router],
  );

  const save = useCallback(async () => {
    if (!dirty.current || !running) return;
    dirty.current = false;
    try {
      await call("save", payload(section));
      setSaveError(false);
    } catch {
      dirty.current = true;
      setSaveError(true);
    }
  }, [call, payload, running, section]);

  // Save a moment after typing stops, and every 15 seconds anyway.
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(save, 1200);
    return () => clearTimeout(t);
  }, [answersL, answersR, writing, running, save]);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(save, 15_000);
    return () => clearInterval(t);
  }, [running, save]);
  // Closing or hiding the tab: send what's there without waiting.
  useEffect(() => {
    if (!running) return;
    const flush = () => {
      if (!dirty.current) return;
      const body = new Blob([JSON.stringify({ action: "save", section, ...payload(section) })], { type: "application/json" });
      if (navigator.sendBeacon(`/api/mock/attempt/${attemptId}`, body)) dirty.current = false;
    };
    const warn = (e: BeforeUnloadEvent) => {
      flush();
      e.preventDefault();
    };
    const onHide = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("beforeunload", warn);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [running, section, payload, attemptId]);

  // The clock.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const finish = useCallback(
    async (auto = false) => {
      if (busy) return;
      setBusy(true);
      try {
        dirty.current = false;
        player.current?.stop();
        const data = await call("finish", payload(section));
        if (data?.section === "DONE") router.push(`/mock/result/${attemptId}`);
        setPanel(auto ? "timeup" : null);
      } catch {
        setSaveError(true);
      } finally {
        setBusy(false);
      }
    },
    [busy, call, payload, section, router, attemptId],
  );

  // Time's up: hand the section in.
  useEffect(() => {
    if (!running || remaining === null || remaining > 0 || busy) return;
    const t = setTimeout(() => void finish(true), 0);
    return () => clearTimeout(t);
  }, [running, remaining, busy, finish]);

  // ─── Listening playback ────────────────────────────────────────────────────
  const listeningSources = useMemo(() => test.listening.map((p) => ({ audio: p.audio, script: p.script })), [test.listening]);
  const startPlayback = (fromPart: number) => {
    player.current?.stop();
    setAudioMessage(null);
    const p = new ListeningPlayer(listeningSources, {
      onPart: (i) => {
        setPlaying(i);
        setPart(i);
        store(k("playingPart"), i);
      },
      onEnd: () => {
        setPlaying(null);
        setAudioDone(true);
        store(k("audioDone"), true);
        void call("audioDone").catch(() => {});
      },
      onError: (message) => setAudioMessage(message),
    });
    p.setVolume(volume);
    player.current = p;
    p.start(fromPart);
  };
  useEffect(() => player.current?.setVolume(volume), [volume]);
  useEffect(() => () => player.current?.stop(), []);

  const startSection = async () => {
    setBusy(true);
    try {
      // Listening starts playing within this click, so the browser allows the sound.
      if (section === "LISTENING") startPlayback(0);
      await call("start");
    } catch {
      setSaveError(true);
    } finally {
      setBusy(false);
    }
  };

  // ─── Questions ─────────────────────────────────────────────────────────────
  const parts: { groups: Group[]; from: number; to: number }[] = useMemo(
    () => (section === "LISTENING" ? test.listening : section === "READING" ? test.reading : []),
    [section, test],
  );
  const answers = section === "LISTENING" ? answersL : answersR;
  const sectionFlags = useMemo(() => new Set(flags[section] ?? []), [flags, section]);
  const answered = useMemo(() => answeredNumbers(parts.flatMap((p) => p.groups), answers), [parts, answers]);
  const setAnswer = (n: number, value: string) => {
    dirty.current = true;
    (section === "LISTENING" ? setAnswersL : setAnswersR)((a) => ({ ...a, [n]: value }));
  };
  const toggleFlag = (n: number) => {
    setFlags((f) => {
      const list = new Set(f[section] ?? []);
      if (list.has(n)) list.delete(n);
      else list.add(n);
      const next = { ...f, [section]: [...list] };
      store(k("flags"), next);
      return next;
    });
  };
  const goTo = (n: number) => {
    const p = parts.findIndex((x) => n >= x.from && n <= x.to);
    if (p >= 0) setPart(p);
    setCurrent(n);
    requestAnimationFrame(() => {
      const el = document.getElementById(`q-${n}`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      (el?.matches("input,select") ? el : el?.querySelector<HTMLElement>("input,select"))?.focus({ preventScroll: true });
    });
  };
  const allNumbers = parts.flatMap((p) => Array.from({ length: Math.max(0, p.to - p.from + 1) }, (_, i) => p.from + i));
  const step = (dir: 1 | -1) => {
    if (section === "WRITING") {
      setPart((p) => Math.min(1, Math.max(0, p + dir)));
      return;
    }
    const at = current === null ? -1 : allNumbers.indexOf(current);
    const target = allNumbers[Math.min(allNumbers.length - 1, Math.max(0, at + dir))];
    if (target !== undefined) goTo(target);
  };
  const answerProps: AnswerProps = { answers, setAnswer, flags: sectionFlags, toggleFlag, focus: setCurrent, current };

  const style = { ...CONTRAST[prefs.contrast], fontSize: FONT[prefs.font] } as CSSProperties;
  const setPref = (p: Partial<Prefs>) =>
    setPrefs((old) => {
      const next = { ...old, ...p };
      store("mock-prefs", next);
      return next;
    });

  // ─── Screens ───────────────────────────────────────────────────────────────
  const header = (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--ex-line)] px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="rounded bg-[var(--ex-fg)] px-1.5 py-0.5 text-[0.8em] font-black tracking-wider text-[var(--ex-bg)]">CD MOCK</span>
        <span className="hidden min-w-0 truncate text-[0.85em] text-[var(--ex-muted)] sm:block">
          Candidate {candidate.number} · <span className="font-semibold text-[var(--ex-fg)]">{candidate.name}</span>
        </span>
      </div>
      <div className="mx-auto">
        {running && remaining !== null && (
          <span
            role="timer"
            className={cn("rounded px-3 py-1 font-bold tabular-nums", remaining < 300_000 ? "bg-red-600 text-white" : "bg-[var(--ex-panel)]")}
          >
            {/* While the recording plays, its length decides the time; then two minutes to check answers. */}
            {section === "LISTENING" && !audioDone && remaining > 300_000 ? (
              <span className="inline-flex items-center gap-1.5">
                <Headphones className="size-[1em]" /> {playing === null ? "Listening" : `Recording: Part ${playing + 1} of ${test.listening.length}`}
              </span>
            ) : (
              timeLeft(remaining)
            )}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        {section === "LISTENING" && (
          <label className="hidden items-center gap-1.5 sm:flex" title="Volume">
            <Volume2 className="size-[1.1em]" />
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume" className="w-24 accent-[var(--ex-accent)]" />
          </label>
        )}
        <IconButton label="Settings" onClick={() => setPanel(panel === "settings" ? null : "settings")}>
          <Settings className="size-[1.1em]" />
        </IconButton>
        <IconButton label="Help" onClick={() => setPanel("help")}>
          <CircleHelp className="size-[1.1em]" />
        </IconButton>
        <IconButton label="Hide screen" onClick={() => setHidden(true)}>
          <EyeOff className="size-[1.1em]" />
        </IconButton>
      </div>
    </header>
  );

  let body: ReactNode;
  if (section === "DONE") {
    body = (
      <Centered>
        <h1 className="text-[1.6em] font-bold">You have finished the test</h1>
        <p className="mt-2 text-[var(--ex-muted)]">Your answers have been saved.</p>
        <button className={primary} onClick={() => router.push(`/mock/result/${attemptId}`)}>
          See my results
        </button>
      </Centered>
    );
  } else if (section === "LISTENING" && !confirmed && endsAt === null) {
    body = (
      <Centered>
        <h1 className="text-[1.6em] font-bold">Confirm your details</h1>
        <dl className="mx-auto mt-6 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-left">
          <dt className="text-[var(--ex-muted)]">Name</dt>
          <dd className="font-semibold">{candidate.name}</dd>
          <dt className="text-[var(--ex-muted)]">Candidate number</dt>
          <dd className="font-semibold tabular-nums">{candidate.number}</dd>
          <dt className="text-[var(--ex-muted)]">Test</dt>
          <dd className="font-semibold">{title}</dd>
        </dl>
        <p className="mt-6 text-[0.9em] text-[var(--ex-muted)]">If your details aren&apos;t correct, please tell the invigilator.</p>
        <button
          className={primary}
          onClick={() => {
            setConfirmed(true);
            store(k("confirmed"), true);
          }}
        >
          My details are correct
        </button>
      </Centered>
    );
  } else if (endsAt === null) {
    body = <Intro section={section} test={test} busy={busy} onStart={startSection} volume={volume} setVolume={setVolume} />;
  } else if (section === "WRITING") {
    const task = test.writing[part] ?? test.writing[0];
    const key = (part === 1 ? "2" : "1") as "1" | "2";
    body = (
      <>
        <PartStrip title={`Part ${part + 1}`} text={`You should spend about ${part === 0 ? 20 : 40} minutes on this task. Write at least ${task.minWords} words.`} />
        <SplitPane
          left={
            <div className="space-y-3 p-5">
              <div className="whitespace-pre-line">
                <RichText text={task.prompt} />
              </div>
              {task.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={task.image} alt="Task 1 chart" className="max-w-full rounded border border-[var(--ex-line)] bg-white" />
              )}
            </div>
          }
          right={
            <div className="flex h-full flex-col p-4">
              <textarea
                aria-label={`Part ${part + 1} answer`}
                value={writing[key]}
                spellCheck={false}
                autoCorrect="off"
                onChange={(e) => {
                  dirty.current = true;
                  const value = e.target.value;
                  setWriting((w) => ({ ...w, [key]: value }));
                }}
                className="min-h-[18em] w-full flex-1 resize-none rounded-[3px] border border-[var(--ex-line-strong)] bg-[var(--ex-bg)] p-3 leading-relaxed text-[var(--ex-fg)] outline-none focus:border-[var(--ex-accent)]"
              />
              <p className="mt-2 text-right text-[0.9em] text-[var(--ex-muted)]">Word count: {wordCount(writing[key])}</p>
            </div>
          }
        />
      </>
    );
  } else {
    const p = parts[part];
    const range = p.to >= p.from ? `${p.from}–${p.to}` : "";
    const questions = (
      <div className="p-5">
        <QuestionGroups groups={p.groups} props={answerProps} />
      </div>
    );
    body = (
      <>
        <PartStrip
          title={`Part ${part + 1}`}
          text={section === "LISTENING" ? `Listen and answer questions ${range}.` : `Read the text and answer questions ${range}.`}
        />
        {section === "LISTENING" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {(playing === null || audioMessage) && (
              <div className="mx-auto mt-4 max-w-4xl px-5">
                <div className="flex flex-wrap items-center gap-3 rounded-[3px] border border-[var(--ex-line-strong)] bg-[var(--ex-panel)] px-4 py-3 text-[0.95em]">
                  <Headphones className="size-[1.2em]" />
                  {audioDone ? (
                    <span>The recording has finished. Check your answers before the time runs out.</span>
                  ) : (
                    <>
                      <span className="flex-1">{audioMessage ?? "The recording stopped when the page was reloaded."}</span>
                      <button className="inline-flex items-center gap-1.5 rounded bg-[var(--ex-accent)] px-3 py-1.5 font-semibold text-white" onClick={() => startPlayback(stored(k("playingPart"), 0))}>
                        <Play className="size-[1em]" /> Continue the recording
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            <div className="mx-auto max-w-4xl">{questions}</div>
          </div>
        ) : (
          <SplitPane left={<ReadingPassage key={part} attemptId={attemptId} index={part} passage={test.reading[part]} />} right={questions} />
        )}
      </>
    );
  }

  const nav =
    running ? (
      <footer className="flex min-h-16 shrink-0 items-stretch gap-1 overflow-x-auto border-t border-[var(--ex-line)] bg-[var(--ex-bg)] px-2">
        {(section === "WRITING" ? test.writing.map((_, i) => ({ from: 0, to: -1, index: i })) : parts.map((p, i) => ({ from: p.from, to: p.to, index: i }))).map(
          ({ from, to, index }) => {
            const active = index === part;
            const count = Math.max(0, to - from + 1);
            const done = Array.from({ length: count }, (_, i) => from + i).filter((n) => answered.has(n)).length;
            return (
              <div key={index} className={cn("flex shrink-0 items-center gap-2 px-2 py-2", active && "rounded bg-[var(--ex-panel)]")}>
                <button className="font-bold whitespace-nowrap" onClick={() => setPart(index)} aria-current={active ? "step" : undefined}>
                  Part {index + 1}
                  {section === "LISTENING" && playing === index && <Volume2 className="ml-1 inline size-[0.9em] text-[var(--ex-accent)]" />}
                </button>
                {section === "WRITING" ? (
                  <span className="text-[0.85em] text-[var(--ex-muted)] whitespace-nowrap">{wordCount(writing[index === 0 ? "1" : "2"])} words</span>
                ) : active ? (
                  <span className="flex flex-wrap gap-1">
                    {Array.from({ length: count }, (_, i) => from + i).map((n) => (
                      <button
                        key={n}
                        onClick={() => goTo(n)}
                        aria-label={`Question ${n}${answered.has(n) ? ", answered" : ""}${sectionFlags.has(n) ? ", marked for review" : ""}`}
                        className={cn(
                          "relative grid size-[1.9em] place-items-center rounded-[3px] border text-[0.85em] font-semibold tabular-nums",
                          answered.has(n) ? "border-[var(--ex-fg)] bg-[var(--ex-fg)] text-[var(--ex-bg)]" : "border-[var(--ex-line-strong)]",
                          current === n && "ring-2 ring-[var(--ex-accent)] ring-offset-1",
                          sectionFlags.has(n) && "rounded-full",
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </span>
                ) : (
                  <span className="text-[0.85em] text-[var(--ex-muted)] whitespace-nowrap">
                    {done} of {count}
                  </span>
                )}
              </div>
            );
          },
        )}
        <div className="ml-auto flex shrink-0 items-center gap-1 pl-2">
          {section !== "WRITING" && (
            // Marks the current question for review, as the checkbox in the real test does.
            <label className={cn("mr-1 flex items-center gap-1.5 rounded border border-[var(--ex-line-strong)] px-2 py-1.5 text-[0.85em] font-semibold", current === null && "opacity-50")}>
              <input
                type="checkbox"
                disabled={current === null}
                checked={current !== null && sectionFlags.has(current)}
                onChange={() => current !== null && toggleFlag(current)}
                className="size-[1em] accent-[var(--ex-accent)]"
              />
              Review
            </label>
          )}
          <IconButton label="Previous" onClick={() => step(-1)} big>
            <ChevronLeft className="size-[1.3em]" />
          </IconButton>
          <IconButton label="Next" onClick={() => step(1)} big>
            <ChevronRight className="size-[1.3em]" />
          </IconButton>
          <button
            onClick={() => setPanel("submit")}
            className="ml-1 inline-flex h-10 items-center gap-1.5 rounded bg-[var(--ex-fg)] px-3 font-semibold text-[var(--ex-bg)]"
          >
            <Check className="size-[1.1em]" /> Submit
          </button>
        </div>
      </footer>
    ) : null;

  return (
    <div style={style} className="fixed inset-0 z-40 flex flex-col bg-[var(--ex-bg)] text-[var(--ex-fg)]" data-no-press>
      {header}
      {saveError && (
        <p role="alert" className="bg-amber-500 px-4 py-1.5 text-center text-[0.85em] font-semibold text-black">
          Your answers couldn&apos;t be saved — check the internet connection. We&apos;ll keep trying.
        </p>
      )}
      <main className="flex min-h-0 flex-1 flex-col">{body}</main>
      {nav}

      {panel === "settings" && (
        <div className="absolute top-14 right-3 z-50 w-72 rounded-md border border-[var(--ex-line-strong)] bg-[var(--ex-bg)] p-4 shadow-xl">
          <p className="font-bold">Text size</p>
          <div className="mt-2 grid grid-cols-3 gap-1">
            {(Object.keys(FONT) as Prefs["font"][]).map((f) => (
              <button key={f} onClick={() => setPref({ font: f })} className={cn("rounded border px-2 py-1 text-[0.85em]", prefs.font === f ? "border-[var(--ex-accent)] bg-[var(--ex-accent-soft)] font-bold" : "border-[var(--ex-line)]")}>
                {f === "standard" ? "Standard" : f === "large" ? "Large" : "Extra large"}
              </button>
            ))}
          </div>
          <p className="mt-4 font-bold">Colours</p>
          <div className="mt-2 grid gap-1">
            {(Object.keys(CONTRAST) as Prefs["contrast"][]).map((c) => (
              <button key={c} onClick={() => setPref({ contrast: c })} className={cn("rounded border px-2 py-1 text-left text-[0.85em]", prefs.contrast === c ? "border-[var(--ex-accent)] bg-[var(--ex-accent-soft)] font-bold" : "border-[var(--ex-line)]")}>
                {c === "standard" ? "Black on white" : c === "inverse" ? "White on black" : "Yellow on black"}
              </button>
            ))}
          </div>
          <button onClick={() => setPanel(null)} className="mt-4 w-full rounded bg-[var(--ex-fg)] py-1.5 font-semibold text-[var(--ex-bg)]">
            Done
          </button>
        </div>
      )}
      {panel === "help" && (
        <Modal onClose={() => setPanel(null)} title="Help">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Use the numbers at the bottom of the screen to go to any question. Answered questions are filled in.</li>
            <li>Click the flag next to a question to mark it for review; it shows as a round number at the bottom.</li>
            <li>In Reading, select words in the text and choose Highlight. Drag the bar between the text and the questions to resize them.</li>
            <li>In Listening you hear each part once. The volume control is at the top of the screen.</li>
            <li>Your answers are saved automatically. When the time runs out, the section is handed in for you.</li>
            <li>Settings (the gear) change the text size and colours.</li>
          </ul>
        </Modal>
      )}
      {panel === "submit" && (
        <Modal onClose={() => setPanel(null)} title={`Submit ${section.toLowerCase()}?`}>
          <p>
            {section === "WRITING"
              ? "You won't be able to change your writing after this. This is the end of the test."
              : `You have answered ${answered.size} of ${allNumbers.length} questions. You won't be able to come back to this section.`}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setPanel(null)} className="rounded border border-[var(--ex-line-strong)] px-4 py-2 font-semibold">
              Go back
            </button>
            <button disabled={busy} onClick={() => finish()} className="rounded bg-[var(--ex-accent)] px-4 py-2 font-semibold text-white disabled:opacity-60">
              {busy ? "Submitting…" : "Submit"}
            </button>
          </div>
        </Modal>
      )}
      {panel === "timeup" && (
        <Modal onClose={() => setPanel(null)} title="Time is up">
          <p>This section has ended and your answers have been saved.</p>
          <div className="mt-5 flex justify-end">
            <button onClick={() => setPanel(null)} className="rounded bg-[var(--ex-accent)] px-4 py-2 font-semibold text-white">
              Continue
            </button>
          </div>
        </Modal>
      )}
      {hidden && (
        <button onClick={() => setHidden(false)} className="absolute inset-0 z-[60] grid place-items-center bg-[var(--ex-bg)]">
          <span className="rounded border border-[var(--ex-line-strong)] px-5 py-3 font-semibold">Screen hidden — click to show the test</span>
        </button>
      )}
    </div>
  );
}

const primary = "mt-8 inline-flex items-center justify-center rounded bg-[var(--ex-accent)] px-6 py-2.5 font-semibold text-white disabled:opacity-60";

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center overflow-y-auto p-6">
      <div className="w-full max-w-2xl text-center">{children}</div>
    </div>
  );
}

function IconButton({ label, onClick, children, big }: { label: string; onClick: () => void; children: ReactNode; big?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={cn("grid place-items-center rounded hover:bg-[var(--ex-hover)]", big ? "size-10 border border-[var(--ex-line-strong)]" : "size-9")}>
      {children}
    </button>
  );
}

function PartStrip({ title, text }: { title: string; text: string }) {
  return (
    <div className="shrink-0 border-b border-[var(--ex-line)] bg-[var(--ex-panel)] px-5 py-2.5">
      <p className="font-bold">{title}</p>
      <p className="text-[0.95em]">{text}</p>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-lg rounded-md bg-[var(--ex-bg)] p-5 text-[var(--ex-fg)] shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[1.2em] font-bold">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="grid size-8 place-items-center rounded hover:bg-[var(--ex-hover)]">
            <X className="size-[1.1em]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Text on the left, questions or the answer on the right, with a bar in between to resize them. Stacked on phones. */
function SplitPane({ left, right }: { left: ReactNode; right: ReactNode }) {
  const [width, setWidth] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const drag = (e: React.PointerEvent) => {
    const el = box.current;
    if (!el) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      setWidth(Math.min(75, Math.max(25, ((ev.clientX - r.left) / r.width) * 100)));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <div ref={box} className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
      <div className="shrink-0 border-b border-[var(--ex-line)] md:min-h-0 md:overflow-y-auto md:border-b-0" style={{ flexBasis: `${width}%` }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize"
        onPointerDown={drag}
        className="hidden w-2 shrink-0 cursor-col-resize border-x border-[var(--ex-line)] bg-[var(--ex-panel)] md:block"
      />
      <div className="min-w-0 flex-1 md:min-h-0 md:overflow-y-auto">{right}</div>
    </div>
  );
}

function Intro({ section, test, busy, onStart, volume, setVolume }: { section: Section; test: PublicTest; busy: boolean; onStart: () => void; volume: number; setVolume: (v: number) => void }) {
  const total = section === "LISTENING" ? test.totals.listening : section === "READING" ? test.totals.reading : 2;
  const info =
    section === "LISTENING"
      ? {
          title: "IELTS Listening",
          time: "Time: approximately 30 minutes",
          points: [
            "Answer all the questions. You can change your answers at any time during the test.",
            `There are ${total} questions in this test. Each question carries one mark.`,
            "There are four parts to the test. You will hear each part once.",
            "For each part there is time to look through the questions and time to check your answers.",
            "At the end you have two minutes to check all your answers.",
          ],
        }
      : section === "READING"
        ? {
            title: "IELTS Reading",
            time: "Time: 1 hour",
            points: [
              "Answer all the questions. You can change your answers at any time during the test.",
              `There are ${total} questions in this test. Each question carries one mark.`,
              "There are three parts to the test. You can select words in the texts and highlight them.",
            ],
          }
        : {
            title: "IELTS Writing",
            time: "Time: 1 hour",
            points: ["Answer both parts.", "Part 2 contributes twice as much as Part 1 to the writing score.", "You can change your answers at any time during the test."],
          };
  return (
    <Centered>
      <div className="text-left">
        <h1 className="text-[1.6em] font-bold">{info.title}</h1>
        <p className="mt-1 font-semibold">{info.time}</p>
        <h2 className="mt-6 font-bold">Instructions to candidates</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          {info.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        {section === "LISTENING" && (
          <div className="mt-6 rounded border border-[var(--ex-line-strong)] p-4">
            <p className="flex items-center gap-2 font-bold">
              <Headphones className="size-[1.2em]" /> Put on your headphones and check the sound
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button onClick={() => void soundCheck(volume)} className="inline-flex items-center gap-1.5 rounded border border-[var(--ex-line-strong)] px-3 py-1.5 font-semibold">
                <Play className="size-[1em]" /> Play sound
              </button>
              <label className="flex items-center gap-2">
                <Volume2 className="size-[1.1em]" />
                <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} aria-label="Volume" className="w-40 accent-[var(--ex-accent)]" />
              </label>
            </div>
          </div>
        )}
        <p className="mt-6 text-[0.9em] text-[var(--ex-muted)]">The clock starts when you press Start. Do not close this window.</p>
      </div>
      <button className={primary} disabled={busy} onClick={onStart}>
        {busy ? "Starting…" : section === "LISTENING" ? "Start the test" : "Start"}
      </button>
    </Centered>
  );
}
