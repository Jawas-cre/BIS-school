import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { visibleTo } from "@/lib/auth";

/** Subjects (with topics) available to a center: platform subjects plus the center's own. */
export const visibleSubjects = cache(async (centerId: string | null) =>
  db.subject.findMany({
    where: visibleTo(centerId),
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { topics: { orderBy: [{ order: "asc" }, { name: "asc" }] } },
  }),
);

export type SubjectWithTopics = Awaited<ReturnType<typeof visibleSubjects>>[number];

/** The subjects a student studies, from their group memberships. */
export function enrolledSubjectIds(user: { memberships: { group: { subjectId: string | null } }[] }) {
  return [...new Set(user.memberships.map((m) => m.group.subjectId).filter((id): id is string => Boolean(id)))];
}
