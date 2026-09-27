import { db } from "@/lib/db";
import { canManagePlatform, requireCenterAdmin } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";
import { ADMIN_NAV } from "@/components/shell/nav";
import { logout } from "@/app/(auth)/actions";

// Center admins only. Teachers have their own panel under /teacher and are sent there.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireCenterAdmin();
  // New trial lesson requests from the website wait next to Applications.
  const newLeads = await db.lead.count({ where: { centerId: user.centerId, status: "NEW" } });
  const nav = ADMIN_NAV.map((item) => (item.href === "/admin/leads" && newLeads ? { ...item, badge: String(newLeads) } : item));
  return (
    <AppShell
      area="admin"
      nav={nav}
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
