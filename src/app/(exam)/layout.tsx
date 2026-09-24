import type { CSSProperties } from "react";
import { requireStudentArea } from "@/lib/auth";

// Distraction-free layout for the exam runner: no sidebar, no navigation.
export default async function ExamLayout({ children }: LayoutProps<"/">) {
  const user = await requireStudentArea();
  return (
    <div className="min-h-dvh bg-surface" style={user.center?.accent ? ({ "--brand": user.center.accent } as CSSProperties) : undefined}>
      {children}
    </div>
  );
}
