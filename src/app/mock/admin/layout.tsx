import Link from "next/link";
import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { ArrowLeftRight, ExternalLink, Headphones, LogOut } from "lucide-react";
import { getCurrentUser, homeFor, isStaff, panelBase } from "@/lib/auth";
import { MOCK_ONLY, STAFF_LOGIN } from "@/lib/app-mode";
import { logout } from "@/app/(auth)/actions";
import { MockAdminNav } from "@/components/mock/admin-nav";
import { LanguageMenu } from "@/components/language-menu";
import { ThemeMenu } from "@/components/theme-menu";
import { getT } from "@/lib/i18n/server";

// The CD mock's staff area: center admins and teachers sign in with their BIS Learn account. On the
// mock's own site (MOCK_ONLY) the staff area also has the staff list, settings and a log-out button.
export default async function MockAdminLayout({ children }: LayoutProps<"/mock/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect(`${STAFF_LOGIN}?next=/mock/admin`);
  if (!isStaff(user.role) || !user.center) redirect(homeFor(user.role));
  const t = await getT();
  const A = t.mockAdmin;
  return (
    <div className="flex min-h-dvh flex-col" style={{ "--brand": user.center.accent } as CSSProperties}>
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/mock/admin" className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white">
              <Headphones className="size-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-[16px] font-extrabold tracking-tight">{t.mock.brand}</span>
              <span className="block truncate text-[11px] font-semibold text-muted">{A.staffArea} · {user.center.name}</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link href={`/mock?c=${user.center.slug}`} target="_blank" className="hidden items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-ink-2 hover:bg-surface-2 md:flex">
              <ExternalLink className="size-4" /> {A.candidateSite}
            </Link>
            {!MOCK_ONLY && (
              <Link href={panelBase(user.role)} className="hidden items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-ink-2 hover:bg-surface-2 md:flex">
                <ArrowLeftRight className="size-4" /> BIS Learn
              </Link>
            )}
            <LanguageMenu />
            <ThemeMenu />
            {MOCK_ONLY && (
              <form action={logout}>
                <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-ink-2 hover:bg-surface-2" title={A.logOut}>
                  <span className="hidden max-w-40 truncate sm:block">{user.name}</span>
                  <LogOut className="size-4" />
                </button>
              </form>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2 sm:px-6">
          <MockAdminNav
            items={[
              { href: "/mock/admin", label: A.navResults },
              { href: "/mock/admin/tests", label: A.navTests },
              { href: "/mock/admin/candidates", label: A.navCandidates },
              ...(MOCK_ONLY && user.role === "CENTER_ADMIN" ? [{ href: "/mock/admin/staff", label: A.navStaff }] : []),
              ...(MOCK_ONLY ? [{ href: "/mock/admin/settings", label: A.navSettings }] : []),
            ]}
          />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
