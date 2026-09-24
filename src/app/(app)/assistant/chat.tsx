"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles, Square } from "lucide-react";
import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

type Message = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "When do I use a semicolon vs. a colon on the SAT?",
  "Give me 3 hard quadratic questions, one at a time",
  "Make a 6-week study plan to go from 1300 to 1450",
  "Explain how to find the vertex of a parabola quickly",
];

export function Chat({ conversationId: initialId, initialMessages, initialDraft }: { conversationId: string | null; initialMessages: Message[]; initialDraft: string }) {
  const router = useRouter();
  const [conversationId, setConversationId] = useState(initialId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState(initialDraft);
  const [streaming, setStreaming] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    setDraft("");
    const userMsg: Message = { id: `u${Date.now()}`, role: "user", content };
    const botId = `a${Date.now()}`;
    setMessages((m) => [...m, userMsg, { id: botId, role: "assistant", content: "" }]);
    setStreaming(true);
    abort.current = new AbortController();
    const append = (chunk: string) => setMessages((m) => m.map((x) => (x.id === botId ? { ...x, content: x.content + chunk } : x)));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: content }),
        signal: abort.current.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        append(`_${data.error ?? "Something went wrong. Please try again."}_`);
        return;
      }
      const id = res.headers.get("X-Conversation-Id");
      if (id && id !== conversationId) {
        setConversationId(id);
        window.history.replaceState(null, "", `/assistant/${id}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        append(decoder.decode(value, { stream: true }));
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) append("\n\n_Connection lost. Please try again._");
    } finally {
      setStreaming(false);
      abort.current = null;
      router.refresh(); // update the conversation list
      input.current?.focus();
    }
  }

  return (
    <div className="flex min-h-0 flex-col bg-bg">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-5 py-10 text-center">
            <div className="grid size-14 place-items-center rounded-2xl bg-brand text-white shadow-card">
              <Sparkles className="size-7" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-extrabold">Your SAT tutor, any time</h1>
            <p className="mt-2 max-w-md text-muted">
              Ask about any question, concept or strategy. The assistant knows your goal and weak spots, and explains step by step.
            </p>
            <div className="mt-8 grid w-full gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm font-medium text-ink-2 shadow-card hover:border-line-strong hover:text-ink">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand px-4 py-2.5 whitespace-pre-wrap text-white">{m.content}</div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    {m.content ? (
                      <Markdown className="text-[15px] text-ink">{m.content}</Markdown>
                    ) : (
                      <div className="flex gap-1 pt-2" aria-label="Thinking">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="size-2 rounded-full bg-muted" style={{ animation: `pulse-dot 1.2s ${i * 0.2}s infinite` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            <div ref={bottom} />
          </div>
        )}
      </div>

      <div className="border-t border-line bg-surface px-4 py-3 sm:px-6">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-line-strong bg-surface p-2 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand-soft"
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
          <textarea
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send(draft);
              }
            }}
            rows={Math.min(8, Math.max(1, draft.split("\n").length))}
            placeholder="Ask about a question, a concept, or your study plan…"
            className="max-h-48 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-[15px] text-ink outline-none placeholder:text-muted"
            maxLength={4000}
          />
          {streaming ? (
            <button type="button" onClick={() => abort.current?.abort()} aria-label="Stop" className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-surface">
              <Square className="size-4 fill-current" />
            </button>
          ) : (
            <button type="submit" disabled={!draft.trim()} aria-label="Send" className={cn("grid size-10 shrink-0 place-items-center rounded-xl bg-brand text-white disabled:opacity-40")}>
              <ArrowUp className="size-5" />
            </button>
          )}
        </form>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted">Enter to send · Shift+Enter for a new line</p>
      </div>
    </div>
  );
}
