import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { readSession, type Role } from "@/lib/session";

/** The signed-in user (with center), or null. Deduplicated per request. */
export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  return db.user.findUnique({
    where: { id: session.userId },
    include: {
      center: true,
      targetUni: true,
      memberships: { include: { group: { include: { subject: true, teacher: { select: { name: true } } } } } },
    },
  });
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Students must finish onboarding before using the app. */
export async function requireStudentArea() {
  const user = await requireUser();
  if (user.role === "STUDENT" && !user.onboarded) redirect("/onboarding");
  return user;
}

export const STAFF_ROLES: Role[] = ["CENTER_ADMIN", "TEACHER"];

export function isStaff(role: string) {
  return role === "CENTER_ADMIN" || role === "TEACHER";
}

/** Center admin or teacher, always scoped to a center. */
export async function requireStaff() {
  const user = await requireUser();
  if (!isStaff(user.role) || !user.centerId) redirect("/dashboard");
  return user as CurrentUser & { centerId: string };
}

export async function requireCenterAdmin() {
  const user = await requireStaff();
  if (user.role !== "CENTER_ADMIN") redirect("/admin");
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/dashboard");
  return user;
}

/** Content rows visible to a user: platform-wide (centerId null) plus their own center's. */
export function visibleTo(centerId: string | null) {
  return centerId ? { OR: [{ centerId: null }, { centerId }] } : { centerId: null };
}

export function homeFor(role: string) {
  if (role === "SUPER_ADMIN") return "/platform";
  if (isStaff(role)) return "/admin";
  return "/dashboard";
}
