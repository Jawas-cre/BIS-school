"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { ChoiceMenu } from "@/components/ui/choice-menu";
import { setLocale } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/client";
import { LOCALES, LOCALE_NAMES, type Locale } from "@/lib/i18n/config";

export function LanguageMenu({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <ChoiceMenu<Locale>
      label={t.language.label}
      className={className}
      trigger={
        <>
          <Globe className={pending ? "size-[18px] animate-spin" : "size-[18px]"} />
          <span className="text-xs font-bold uppercase">{locale}</span>
        </>
      }
      value={locale}
      onChange={(next) =>
        startTransition(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
      options={LOCALES.map((l) => ({ value: l, label: LOCALE_NAMES[l] }))}
    />
  );
}
