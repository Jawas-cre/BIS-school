"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { DICTIONARIES } from "./dictionaries";
import { formatters } from "./format";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** Text and formatters for client components. */
export function useI18n() {
  const locale = useContext(LocaleContext);
  return useMemo(() => ({ locale, t: DICTIONARIES[locale], ...formatters(locale) }), [locale]);
}

export function useT() {
  return DICTIONARIES[useContext(LocaleContext)];
}
