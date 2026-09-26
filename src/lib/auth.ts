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

/** Center admin or teacher, always scoped to a center. Shared pages of both panels use this. */
export async function requireStaff() {
  const user = await requireUser();
  if (!isStaff(user.role) || !user.centerId) redirect(homeFor(user.role));
  return user as CurrentUser & { centerId: string };
}

/** The admin panel (/admin) and its actions: center admins only. */
export async function requireCenterAdmin() {
  const user = await requireStaff();
  if (user.role !== "CENTER_ADMIN") redirect(homeFor(user.role));
  return user;
}

/** The teacher panel (/teacher): teachers only. */
export async function requireTeacher() {
  const user = await requireStaff();
  if (user.role !== "TEACHER") redirect(homeFor(user.role));
  return user;
}

/** Platform settings: the platform admin, or the owner who installed this copy of the site. */
export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN" && !user.isOwner) redirect(homeFor(user.role));
  return user;
}

export function canManagePlatform(user: { role: string; isOwner: boolean }) {
  return user.role === "SUPER_ADMIN" || user.isOwner;
}

/** Content rows visible to a user: platform-wide (centerId null) plus their own center's. */
export function visibleTo(centerId: string | null) {
  return centerId ? { OR: [{ centerId: null }, { centerId }] } : { centerId: null };
}

/** Staff pages are shared by both panels: center admins see them under /admin, teachers under /teacher. */
export function panelBase(role: string) {
  return role === "TEACHER" ? "/teacher" : "/admin";
}

export function homeFor(role: string) {
  if (role === "SUPER_ADMIN") return "/platform";
  if (isStaff(role)) return panelBase(role);
  return "/dashboard";
}

type Staff = { id: string; role: string; centerId: string };

/** Filter for the groups a staff member works with: the whole center for admins, their own groups for teachers. */
export function staffGroups(staff: Staff) {
  return { centerId: staff.centerId, ...(staff.role === "TEACHER" ? { teacherId: staff.id } : {}) };
}

/** Filter for the students a staff member can see: the whole center for admins, their groups' students for teachers. */
export function staffStudents(staff: Staff) {
  return {
    centerId: staff.centerId,
    role: "STUDENT",
    ...(staff.role === "TEACHER" ? { memberships: { some: { group: { teacherId: staff.id } } } } : {}),
  };
}
