import { canManagePlatform, requireCenterAdmin } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";
import { ADMIN_NAV } from "@/components/shell/nav";
import { logout } from "@/app/(auth)/actions";

// Center admins only. Teachers have their own panel under /teacher and are sent there.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireCenterAdmin();
  return (
    <AppShell
      area="admin"
      nav={ADMIN_NAV}
      accent={user.center?.accent}
      switchLinks={[
        { href: "/dashboard", label: "studentView" },
        ...(canManagePlatform(user) ? [{ href: "/platform", label: "platformSettings" as const }] : []),
      ]}
      logoutAction={logout}
      user={{ name: user.name, email: user.email, role: user.role, streak: 0, xp: 0, centerName: user.center?.name ?? null }}
    >
      {children}
    </AppShell>
  );
}
