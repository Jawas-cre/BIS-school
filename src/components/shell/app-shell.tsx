"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import {
  Building2,
  ClipboardCheck,
  Flame,
  GraduationCap,
  Languages,
  Layers,
  LayoutDashboard,
  Library,
  ListChecks,
  LogOut,
  Map,
  Megaphone,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
  ArrowLeftRight,
  Shapes,
  KeyRound,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { LanguageMenu } from "@/components/language-menu";
import { ThemeMenu } from "@/components/theme-menu";
import { Avatar } from "@/components/ui/misc";
import { PLATFORM_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import type { Dict } from "@/lib/i18n/dictionaries";
import type { NavItem } from "./nav";

const ICONS = {
  LayoutDashboard,
  Map,
  ListChecks,
  ClipboardCheck,
  Languages,
  Library,
  GraduationCap,
  Megaphone,
  Sparkles,
  Users,
  Layers,
  ShieldCheck,
  Settings,
  Building2,
  Shapes,
  KeyRound,
};

export type ShellUser = {
  name: string;
  email: string;
  role: string;
  streak: number;
  xp: number;
  centerName: string | null;
};

function isActive(pathname: string, href: string) {
  if (href === "/admin" || href === "/platform" || href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  nav,
  user,
  accent,
  area,
  switchLink,
  logoutAction,
  children,
}: {
  nav: NavItem[];
  user: ShellUser;
  accent?: string | null;
  area: "student" | "admin" | "platform";
  switchLink?: { href: string; label: keyof Dict["nav"] } | null;
  logoutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { t, num } = useI18n();
  // Students manage their details on /profile; staff and the platform owner on "My account".
  const accountHref = area === "student" ? "/profile" : `/${area}/account`;
  // The drawer remembers which page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <LogoMark />
        <div className="min-w-0 leading-tight">
          <div className="font-display text-[16px] font-extrabold tracking-tight text-ink">{PLATFORM_NAME}</div>
          <div className="truncate text-[11px] font-semibold text-muted">
            {area === "platform" ? t.shell.platformAdmin : (user.centerName ?? "")}
          </div>
        </div>
      </div>
      {area === "admin" && (
        <div className="mx-4 mb-2 rounded-lg bg-surface-2 px-3 py-1.5 text-[11px] font-bold tracking-wider text-muted uppercase">
          {user.role === "CENTER_ADMIN" ? t.shell.centerAdminPanel : t.shell.teacherPanel}
        </div>
      )}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label={t.shell.mainNav}>
        {nav.map((item) => {
          const Icon = ICONS[item.icon as keyof typeof ICONS] ?? LayoutDashboard;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold transition-colors",
                active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
              )}
            >
              <Icon className={cn("size-[18px] shrink-0", active ? "text-brand" : "text-muted group-hover:text-ink")} />
              <span className="truncate">{t.nav[item.label]}</span>
              {item.badge && (
                <span className="ml-auto rounded-full bg-brand px-1.5 py-px text-[10px] font-bold text-white">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-0.5 border-t border-line p-3">
        {switchLink && (
          <Link
            href={switchLink.href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeftRight className="size-[18px] text-muted" />
            {t.nav[switchLink.label]}
          </Link>
        )}
        <Link
          href={accountHref}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold",
            isActive(pathname, accountHref) ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
          )}
        >
          <UserRound className="size-[18px] text-muted" />
          {area === "student" ? t.nav.profile : t.nav.account}
        </Link>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-ink-2 hover:bg-surface-2 hover:text-danger">
            <LogOut className="size-[18px] text-muted" />
            {t.nav.logOut}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh" style={accent ? ({ "--brand": accent } as CSSProperties) : undefined}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-surface lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button aria-label={t.shell.closeMenu} className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-fade-up border-r border-line bg-surface shadow-pop">
            <button
              aria-label={t.shell.closeMenu}
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 grid size-8 place-items-center rounded-lg hover:bg-surface-2"
            >
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] px-4 backdrop-blur-md sm:px-6">
          <button
            aria-label={t.shell.openMenu}
            onClick={() => setOpen(true)}
            className="grid size-9 place-items-center rounded-xl hover:bg-surface-2 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex items-center gap-2 lg:hidden">
            <LogoMark size={28} />
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {area === "student" && (
              <>
                <div
                  className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-sm font-bold tabular-nums"
                  title={t.shell.dayStreak}
                >
                  <Flame className={cn("size-4", user.streak > 0 ? "text-orange-500" : "text-muted")} />
                  {user.streak}
                </div>
                <div
                  className="hidden items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-sm font-bold tabular-nums sm:flex"
                  title={t.shell.xp}
                >
                  <span className="text-[11px] font-extrabold text-brand">XP</span>
                  {num(user.xp)}
                </div>
              </>
            )}
            <LanguageMenu />
            <ThemeMenu />
            <Link
              href={accountHref}
              className="flex items-center gap-2 rounded-xl py-1 pr-1 pl-1 hover:bg-surface-2 sm:pr-3"
            >
              <Avatar name={user.name} size={32} />
              <span className="hidden text-left leading-tight sm:block">
                <span className="block max-w-36 truncate text-sm font-semibold">{user.name}</span>
                <span className="block max-w-36 truncate text-[11px] text-muted">{user.email}</span>
              </span>
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
