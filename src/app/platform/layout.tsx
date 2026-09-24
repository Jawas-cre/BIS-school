import { requireSuperAdmin } from "@/lib/auth";
import { AppShell } from "@/components/shell/app-shell";
import { PLATFORM_NAV } from "@/components/shell/nav";
import { logout } from "@/app/(auth)/actions";

export default async function PlatformLayout({ children }: LayoutProps<"/platform">) {
  const user = await requireSuperAdmin();
  return (
    <AppShell area="platform" nav={PLATFORM_NAV} logoutAction={logout} user={{ name: user.name, email: user.email, role: user.role, streak: 0, xp: 0, centerName: null }}>
      {children}
    </AppShell>
  );
}
