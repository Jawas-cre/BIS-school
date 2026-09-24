import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { DICTIONARIES, type Dict } from "./dictionaries";
import { formatters } from "./format";

/** The visitor's language: their saved choice, else their browser's preference. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  return /(^|[\s,])uz\b/i.test(accept) ? "uz" : DEFAULT_LOCALE;
});

/** Text and formatters for the current request. */
export const getI18n = cache(async () => {
  const locale = await getLocale();
  return { locale, t: DICTIONARIES[locale], ...formatters(locale) };
});

export async function getT(): Promise<Dict> {
  return (await getI18n()).t;
}

/** `export const generateMetadata = pageTitle((t) => t.nav.dashboard);` */
export function pageTitle(pick: (t: Dict) => string) {
  return async (): Promise<Metadata> => ({ title: pick(await getT()) });
}
