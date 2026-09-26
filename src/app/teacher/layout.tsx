import { requireTeacher } from "@/lib/auth";
import { ensureTeacherId } from "@/lib/teacher-id";
import { AppShell } from "@/components/shell/app-shell";
import { TEACHER_NAV } from "@/components/shell/nav";
import { logout } from "@/app/(auth)/actions";

// The teacher panel reuses the admin panel's pages (see the re-exports in this folder); each page
// limits what it shows to the teacher's own groups and students.
export default async function TeacherLayout({ children }: LayoutProps<"/teacher">) {
  const user = await requireTeacher();
  const loginId = await ensureTeacherId(user);
  return (
    <AppShell
      area="teacher"
      nav={TEACHER_NAV}
      accent={user.center?.accent}
      switchLinks={[{ href: "/dashboard", label: "studentView" }]}
      logoutAction={logout}
      user={{ name: user.name, email: user.email, role: user.role, loginId, streak: 0, xp: 0, centerName: user.center?.name ?? null }}
    >
      {children}
    </AppShell>
  );
}
