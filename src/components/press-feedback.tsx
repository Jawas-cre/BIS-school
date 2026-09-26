"use client";

import { useEffect } from "react";

// Everything people tap: buttons, links shaped like buttons or cards, menu items and choice cards.
const TARGETS = 'button, [role="button"], [role^="menuitem"], [role="tab"], a[href], summary, label:has(> input[type="radio"], > input[type="checkbox"])';
/** A quick tap still shows the whole press, not a flicker. */
const MIN_PRESS_MS = 120;
/** Matches the release glide in globals.css ([data-press="up"]). */
const SETTLE_MS = 520;

function pressTarget(node: EventTarget | null) {
  const el = node instanceof Element ? node.closest<HTMLElement>(TARGETS) : null;
  if (!el || el.closest("[data-no-press]") || el.matches(':disabled, [aria-disabled="true"]')) return null;
  // Text links inside sentences stay still; only links shaped like buttons or cards move.
  if (el.tagName === "A" && getComputedStyle(el).display === "inline") return null;
  return el;
}

/** How far an element sinks: bigger elements move less, so a wide card and a small icon button feel alike. */
function pressScale(el: HTMLElement) {
  const { width, height } = el.getBoundingClientRect();
  return 1 - Math.min(0.05, 6 / Math.max(width, height, 1));
}

/**
 * Smooth tap feedback for the whole site: the pressed element eases down a little and glides back
 * when released (styles in globals.css). Done with pointer events rather than :active, which iPhones
 * don't show on a quick tap.
 */
export function PressFeedback() {
  useEffect(() => {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const timers = new WeakMap<HTMLElement, number>();
    let pressed: { el: HTMLElement; at: number } | null = null;

    const press = (el: HTMLElement) => {
      if (reduceMotion.matches) return;
      window.clearTimeout(timers.get(el));
      el.style.setProperty("--press-scale", String(pressScale(el)));
      el.dataset.press = "down";
      pressed = { el, at: performance.now() };
    };

    const release = () => {
      if (!pressed) return;
      const { el, at } = pressed;
      pressed = null;
      const held = performance.now() - at;
      timers.set(
        el,
        window.setTimeout(() => {
          el.dataset.press = "up";
          timers.set(el, window.setTimeout(() => delete el.dataset.press, SETTLE_MS));
        }, Math.max(0, MIN_PRESS_MS - held)),
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const el = pressTarget(e.target);
      if (el) press(el);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== "Enter" && e.key !== " ")) return;
      const el = pressTarget(e.target);
      // Space only activates buttons; Enter also follows links.
      if (el && (e.key === "Enter" || el.tagName !== "A")) press(el);
    };

    const options = { capture: true, passive: true } as const;
    document.addEventListener("pointerdown", onPointerDown, options);
    document.addEventListener("pointerup", release, options);
    document.addEventListener("pointercancel", release, options);
    document.addEventListener("dragstart", release, options);
    document.addEventListener("keydown", onKeyDown, options);
    document.addEventListener("keyup", release, options);
    window.addEventListener("blur", release);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, options);
      document.removeEventListener("pointerup", release, options);
      document.removeEventListener("pointercancel", release, options);
      document.removeEventListener("dragstart", release, options);
      document.removeEventListener("keydown", onKeyDown, options);
      document.removeEventListener("keyup", release, options);
      window.removeEventListener("blur", release);
    };
  }, []);
  return null;
}
