import { requireStudentArea, isStaff, panelBase } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";
import { STUDENT_NAV } from "@/components/shell/nav";
import { logout } from "@/app/(auth)/actions";
import { liveStreak } from "@/lib/activity";

export default async function StudentLayout({ children }: LayoutProps<"/">) {
  const user = await requireStudentArea();
  // Students only see the student area; staff and the platform admin get a way back to their panel.
  const switchLinks = isStaff(user.role)
    ? [{ href: panelBase(user.role), label: user.role === "TEACHER" ? ("teacherPanel" as const) : ("adminPanel" as const) }]
    : user.role === "SUPER_ADMIN"
      ? [{ href: "/platform", label: "platformAdmin" as const }]
      : [];

  return (
    <AppShell
      area="student"
      nav={STUDENT_NAV}
      accent={user.center?.accent}
      switchLinks={switchLinks}
      logoutAction={logout}
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        streak: liveStreak(user),
        xp: user.xp,
        centerName: user.center?.name ?? null,
      }}
    >
      {children}
    </AppShell>
  );
}
