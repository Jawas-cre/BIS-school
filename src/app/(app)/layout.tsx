import { requireStudentArea, isStaff } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";
import { STUDENT_NAV } from "@/components/shell/nav";
import { logout } from "@/app/(auth)/actions";
import { liveStreak } from "@/lib/activity";

export default async function StudentLayout({ children }: LayoutProps<"/">) {
  const user = await requireStudentArea();
  const switchLink = isStaff(user.role)
    ? { href: "/admin", label: "Admin panel" }
    : user.role === "SUPER_ADMIN"
      ? { href: "/platform", label: "Platform admin" }
      : null;

  return (
    <AppShell
      area="student"
      nav={STUDENT_NAV}
      accent={user.center?.accent}
      switchLink={switchLink}
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
