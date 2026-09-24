"use client";

import { Badge } from "./badge";
import { useT } from "@/lib/i18n/client";

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const t = useT();
  const tone = difficulty === "EASY" ? "success" : difficulty === "MEDIUM" ? "warning" : "danger";
  const key = difficulty === "EASY" || difficulty === "MEDIUM" ? difficulty : "HARD";
  return <Badge tone={tone}>{t.difficulty[key]}</Badge>;
}
