"use client";

import { useRef, useState } from "react";
import { Highlighter, Eraser } from "lucide-react";

// A Reading passage the candidate can highlight, as in the computer-delivered test: select words,
// then choose Highlight (or Clear). Highlights are kept in this browser for the attempt.

type Range = [number, number];
type Passage = { title: string; paragraphs: { label: string | null; text: string }[] };

function merge(ranges: Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out.at(-1);
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else out.push([...r]);
  }
  return out;
}

function subtract(ranges: Range[], [a, b]: Range): Range[] {
  return ranges.flatMap(([s, e]) => {
    if (e <= a || s >= b) return [[s, e] as Range];
    const keep: Range[] = [];
    if (s < a) keep.push([s, a]);
    if (e > b) keep.push([b, e]);
    return keep;
  });
}

/** Character position of (node, offset) inside a paragraph's text. */
function offsetIn(root: HTMLElement, node: Node, offset: number) {
  if (node.nodeType !== Node.TEXT_NODE) {
    // A position between elements: count the text before that child.
    const child = node.childNodes[offset];
    let total = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      if (child && (child === walker.currentNode || child.compareDocumentPosition(walker.currentNode) & Node.DOCUMENT_POSITION_FOLLOWING)) break;
      total += walker.currentNode.textContent?.length ?? 0;
    }
    return total;
  }
  let total = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    if (walker.currentNode === node) return total + offset;
    total += walker.currentNode.textContent?.length ?? 0;
  }
  return total;
}

export function ReadingPassage({ attemptId, index, passage }: { attemptId: string; index: number; passage: Passage }) {
  const storageKey = `mock-${attemptId}-hl-${index}`;
  // The passage is drawn in the browser only (see ExamRunner), so this storage is always there.
  const [marks, setMarks] = useState<Record<number, Range[]>>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "{}");
    } catch {
      return {};
    }
  });
  const [menu, setMenu] = useState<{ x: number; y: number; picks: Record<number, Range> } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const save = (next: Record<number, Range[]>) => {
    setMarks(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  };

  const onSelect = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !box.current) return setMenu(null);
    const range = sel.getRangeAt(0);
    const picks: Record<number, Range> = {};
    box.current.querySelectorAll<HTMLElement>("[data-para]").forEach((el) => {
      if (!range.intersectsNode(el)) return;
      const len = el.textContent?.length ?? 0;
      const start = el.contains(range.startContainer) ? offsetIn(el, range.startContainer, range.startOffset) : 0;
      const end = el.contains(range.endContainer) ? offsetIn(el, range.endContainer, range.endOffset) : len;
      if (end > start) picks[Number(el.dataset.para)] = [start, end];
    });
    if (!Object.keys(picks).length) return setMenu(null);
    const rect = range.getBoundingClientRect();
    const outer = box.current.getBoundingClientRect();
    setMenu({ x: rect.left - outer.left + rect.width / 2, y: rect.top - outer.top + box.current.scrollTop, picks });
  };

  const apply = (clear: boolean) => {
    if (!menu) return;
    const next = { ...marks };
    for (const [p, r] of Object.entries(menu.picks)) {
      const i = Number(p);
      next[i] = clear ? subtract(next[i] ?? [], r) : merge([...(next[i] ?? []), r]);
    }
    save(next);
    setMenu(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div ref={box} className="relative p-5" onMouseUp={onSelect} onTouchEnd={() => setTimeout(onSelect, 50)}>
      {passage.title && <h2 className="mb-4 text-[1.25em] font-bold">{passage.title}</h2>}
      <div className="space-y-4 leading-relaxed">
        {passage.paragraphs.map((p, i) => (
          <div key={i} className="flex gap-3">
            {p.label && <span className="w-5 shrink-0 font-bold">{p.label}</span>}
            <p data-para={i} className="min-w-0 whitespace-pre-line">
              {render(p.text, marks[i] ?? [])}
            </p>
          </div>
        ))}
      </div>
      {menu && (
        <div
          className="absolute z-20 flex -translate-x-1/2 -translate-y-full gap-1 rounded-md border border-[var(--ex-line-strong)] bg-[var(--ex-bg)] p-1 shadow-lg"
          style={{ left: menu.x, top: menu.y - 6 }}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <button onClick={() => apply(false)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[0.85em] font-semibold hover:bg-[var(--ex-hover)]">
            <Highlighter className="size-[1em]" /> Highlight
          </button>
          <button onClick={() => apply(true)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[0.85em] font-semibold hover:bg-[var(--ex-hover)]">
            <Eraser className="size-[1em]" /> Clear
          </button>
        </div>
      )}
    </div>
  );
}

function render(text: string, ranges: Range[]) {
  if (!ranges.length) return text;
  const out: React.ReactNode[] = [];
  let at = 0;
  merge(ranges).forEach(([s, e], i) => {
    if (s > at) out.push(text.slice(at, s));
    out.push(
      <mark key={i} className="bg-[var(--ex-mark)] text-inherit">
        {text.slice(s, e)}
      </mark>,
    );
    at = e;
  });
  if (at < text.length) out.push(text.slice(at));
  return out;
}
