import {
  Atom,
  BookOpen,
  Brain,
  Calculator,
  Code2,
  Dna,
  FlaskConical,
  Globe2,
  Landmark,
  Languages,
  Leaf,
  Music,
  Palette,
  PenTool,
  Sigma,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  book: BookOpen,
  math: Calculator,
  sigma: Sigma,
  language: Languages,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  nature: Leaf,
  history: Landmark,
  geography: Globe2,
  code: Code2,
  logic: Brain,
  writing: PenTool,
  art: Palette,
  music: Music,
};

export const SUBJECT_ICON_KEYS = Object.keys(SUBJECT_ICONS);

/** A subject's icon on a tinted tile in the subject's own color. */
export function SubjectIcon({ icon, color, size = 40, className }: { icon: string; color: string; size?: number; className?: string }) {
  const Icon = SUBJECT_ICONS[icon] ?? BookOpen;
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-xl", className)}
      style={{ width: size, height: size, color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
      aria-hidden
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} />
    </span>
  );
}

export function SubjectBadge({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {name}
    </span>
  );
}
