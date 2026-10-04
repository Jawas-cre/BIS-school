import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Headphones, LogOut } from "lucide-react";
import { LanguageMenu } from "@/components/language-menu";
import { ThemeMenu } from "@/components/theme-menu";
import { logoutCandidate } from "@/app/mock/actions";
import { getT } from "@/lib/i18n/server";

/** The CD mock's own header: its name, the center's, and the signed-in candidate. No BIS Learn menus. */
export async function MockShell({
  centerName,
  accent,
  candidate,
  children,
}: {
  centerName?: string | null;
  accent?: string | null;
  candidate?: { name: string; number: string } | null;
  children: ReactNode;
}) {
  const t = await getT();
  const M = t.mock;
  return (
    <div className="flex min-h-dvh flex-col" style={accent ? ({ "--brand": accent } as CSSProperties) : undefined}>
      <header className="sticky top-0 z-30 border-b border-line bg-[color-mix(in_srgb,var(--bg)_85%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link href={candidate ? "/mock/home" : "/mock"} className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white">
              <Headphones className="size-5" />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-[16px] font-extrabold tracking-tight">{M.brand}</span>
              {centerName && <span className="block truncate text-[11px] font-semibold text-muted">{centerName}</span>}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <LanguageMenu />
            <ThemeMenu />
            {candidate && (
              <form action={logoutCandidate}>
                <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-ink-2 hover:bg-surface-2" title={M.logOut}>
                  <span className="hidden text-right leading-tight sm:block">
                    <span className="block max-w-40 truncate">{candidate.name}</span>
                    <span className="block text-[11px] font-normal text-muted tabular-nums">{candidate.number}</span>
                  </span>
                  <LogOut className="size-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
