import { LEVELS, type MasteryLevel } from "@/lib/mastery";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

/** Colors for the five levels, lightest to strongest (like Khan Academy's mastery squares). */
export const LEVEL_COLOR: Record<MasteryLevel, string> = {
  NOT_STARTED: "bg-surface-3",
  ATTEMPTED: "bg-amber-300",
  FAMILIAR: "bg-amber-500",
  PROFICIENT: "bg-[color-mix(in_srgb,var(--brand)_50%,transparent)]",
  MASTERED: "bg-brand",
};

export function MasterySquare({ level, label, className }: { level: MasteryLevel; label: string; className?: string }) {
  return <span role="img" aria-label={label} title={label} className={cn("inline-block size-3 shrink-0 rounded-[4px]", LEVEL_COLOR[level], className)} />;
}

export async function MasteryLegend({ className }: { className?: string }) {
  const t = await getT();
  return (
    <p className={cn("flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted", className)}>
      {LEVELS.map((l) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <MasterySquare level={l} label={t.mastery.level[l]} /> {t.mastery.level[l]}
        </span>
      ))}
    </p>
  );
}
