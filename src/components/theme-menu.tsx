"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { ChoiceMenu } from "@/components/ui/choice-menu";
import { useT } from "@/lib/i18n/client";

type Mode = "system" | "light" | "dark";

const STORAGE_KEY = "theme";
const listeners = new Set<() => void>();

function readMode(): Mode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
}

/** Same rule as the inline script in the root layout: a saved choice wins, otherwise follow the device. */
function applyTheme() {
  const mode = readMode();
  const dark = mode === "dark" || (mode === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

/** Where the new colors start: the color-mode button in the header, or else the top-right corner. */
function revealOrigin() {
  const button = [...document.querySelectorAll<HTMLElement>('[data-menu="theme"]')].find((b) => b.offsetWidth > 0);
  const box = button?.getBoundingClientRect();
  return box ? { x: box.left + box.width / 2, y: box.top + box.height / 2 } : { x: window.innerWidth, y: 0 };
}

/**
 * Switches light/dark smoothly: the new colors spread as a circle from the color-mode button until
 * they reach the far corner of the screen (styles in globals.css). Browsers without view
 * transitions fade the colors instead; with "reduce motion" on it switches at once.
 */
function switchTheme() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return applyTheme();
  const root = document.documentElement;
  if (!document.startViewTransition) {
    root.classList.add("theme-fading");
    applyTheme();
    window.setTimeout(() => root.classList.remove("theme-fading"), 500);
    return;
  }
  const { x, y } = revealOrigin();
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  root.dataset.themeReveal = "";
  const transition = document.startViewTransition(applyTheme);
  transition.ready
    .then(() =>
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
      ),
    )
    .catch(() => {});
  transition.finished.finally(() => delete root.dataset.themeReveal);
}

// The inline script in the root layout calls this when the device switches between light and dark.
if (typeof window !== "undefined") (window as Window & { __switchTheme?: () => void }).__switchTheme = switchTheme;

function setMode(mode: Mode) {
  try {
    if (mode === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
  switchTheme();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const ICONS = { system: Monitor, light: Sun, dark: Moon };

export function ThemeMenu({ className }: { className?: string }) {
  const t = useT();
  const mode = useSyncExternalStore(subscribe, readMode, () => "system" as Mode);
  const Icon = ICONS[mode];
  return (
    <ChoiceMenu
      name="theme"
      label={t.theme.label}
      className={className}
      trigger={<Icon className="size-[18px]" />}
      value={mode}
      onChange={setMode}
      options={(["system", "light", "dark"] as const).map((m) => {
        const OptionIcon = ICONS[m];
        return { value: m, label: t.theme[m], icon: <OptionIcon className="size-4" /> };
      })}
    />
  );
}
