import "server-only";
import { db } from "@/lib/db";

// The teacher's journal: attendance and 1–5 grades per lesson.
export const STATUSES = ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const;
export type AttendanceStatus = (typeof STATUSES)[number];
export const GRADES = [5, 4, 3, 2, 1] as const;

/** Came to the lesson (late still counts as attended). */
export function attended(status: string) {
  return status === "PRESENT" || status === "LATE";
}

export type JournalSummary = { lessons: number; attended: number; rate: number | null; avgGrade: number | null; grades: number };

/**
 * Attendance rate and average grade per student, optionally only in some groups. Excused absences
 * don't count against the rate.
 */
export async function journalSummaries(userIds: string[], groupIds?: string[]) {
  const rows = userIds.length
    ? await db.attendance.findMany({
        where: { userId: { in: userIds }, ...(groupIds ? { lesson: { groupId: { in: groupIds } } } : {}) },
        select: { userId: true, status: true, grade: true },
      })
    : [];
  const out = new Map<string, JournalSummary>();
  for (const id of userIds) out.set(id, { lessons: 0, attended: 0, rate: null, avgGrade: null, grades: 0 });
  const gradeSums = new Map<string, number>();
  for (const r of rows) {
    const s = out.get(r.userId)!;
    if (r.status !== "EXCUSED") {
      s.lessons++;
      if (attended(r.status)) s.attended++;
    }
    if (r.grade) {
      s.grades++;
      gradeSums.set(r.userId, (gradeSums.get(r.userId) ?? 0) + r.grade);
    }
  }
  for (const [id, s] of out) {
    s.rate = s.lessons ? Math.round((s.attended / s.lessons) * 100) : null;
    s.avgGrade = s.grades ? Math.round(((gradeSums.get(id) ?? 0) / s.grades) * 10) / 10 : null;
  }
  return out;
}

/** A group's latest lessons (newest first) with each student's mark. */
export async function recentLessons(groupId: string, take = 8) {
  return db.lesson.findMany({ where: { groupId }, orderBy: { day: "desc" }, take, include: { attendance: true } });
}

/** A student's own lessons across their groups, newest first. */
export async function studentJournal(userId: string, take = 60) {
  return db.attendance.findMany({
    where: { userId },
    orderBy: { lesson: { day: "desc" } },
    take,
    include: { lesson: { include: { group: { select: { id: true, name: true, teacherId: true, subject: { select: { name: true, color: true } } } } } } },
  });
}
