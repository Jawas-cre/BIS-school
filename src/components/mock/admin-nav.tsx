"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MockAdminNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = item.href === "/mock/admin" ? pathname === item.href || pathname.startsWith("/mock/admin/results") : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn("shrink-0 rounded-xl px-3 py-1.5 text-sm font-semibold", active ? "bg-brand-soft text-brand" : "text-ink-2 hover:bg-surface-2")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
