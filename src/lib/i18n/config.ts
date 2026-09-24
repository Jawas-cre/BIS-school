export const LOCALES = ["en", "uz"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lang";

/** Names shown in the language menu, each in its own language. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", uz: "Oʻzbekcha" };

/** BCP 47 tags used for dates and numbers. */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-US", uz: "uz-Latn-UZ" };

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
