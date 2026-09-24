import { requireStaff } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";
import { ADMIN_NAV } from "@/components/shell/nav";
import { logout } from "@/app/(auth)/actions";

const ADMIN_ONLY = new Set(["/admin/staff", "/admin/settings"]);

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireStaff();
  const nav = user.role === "CENTER_ADMIN" ? ADMIN_NAV : ADMIN_NAV.filter((n) => !ADMIN_ONLY.has(n.href));
  return (
    <AppShell
      area="admin"
      nav={nav}
      accent={user.center?.accent}
      switchLink={{ href: "/dashboard", label: "studentView" }}
      logoutAction={logout}
      user={{ name: user.name, email: user.email, role: user.role, streak: 0, xp: 0, centerName: user.center?.name ?? null }}
    >
      {children}
    </AppShell>
  );
}
