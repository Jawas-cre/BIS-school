import Link from "next/link";
import { PLATFORM_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      <path d="M9 22.5V9.5h6.2c2.7 0 4.3 1.3 4.3 3.4 0 1.4-.8 2.4-2 2.8 1.6.3 2.6 1.5 2.6 3.1 0 2.3-1.8 3.7-4.6 3.7H9Z" fill="white" />
      <circle cx="23.5" cy="21" r="2.2" fill="white" opacity=".85" />
    </svg>
  );
}

export function Logo({ href = "/", subtitle, className }: { href?: string; subtitle?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="leading-tight">
        <span className="block font-display text-[17px] font-extrabold tracking-tight text-ink">{PLATFORM_NAME}</span>
        {subtitle && <span className="block max-w-40 truncate text-[11px] font-semibold text-muted">{subtitle}</span>}
      </span>
    </Link>
  );
}
