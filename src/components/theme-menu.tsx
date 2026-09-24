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

/** Switches colors with a short cross-fade instead of a hard cut (styles in globals.css). */
function applySmoothly() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return applyTheme();
  if (document.startViewTransition) {
    document.startViewTransition(applyTheme);
    return;
  }
  const root = document.documentElement;
  root.classList.add("theme-fading");
  applyTheme();
  window.setTimeout(() => root.classList.remove("theme-fading"), 450);
}

function setMode(mode: Mode) {
  try {
    if (mode === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, mode);
  } catch {}
  applySmoothly();
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
