import { createElement, Fragment, type ReactNode } from "react";
import { INTL_LOCALE, type Locale } from "./config";
import { TIMEZONE } from "@/lib/utils";

type Vars = Record<string, string | number>;

/** Fills `{name}` placeholders. Unknown placeholders are left as they are. */
export function fmt(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

export type PluralForms = { one: string; other: string };

/** Picks the singular or plural form for `n` and fills `{n}` plus any other placeholders. */
export function plural(forms: PluralForms, n: number, vars: Vars = {}): string {
  return fmt(n === 1 ? forms.one : forms.other, { n, ...vars });
}

/** Like `fmt`, but placeholders can be filled with elements (links, bold text, …). */
export function rich(template: string, nodes: Record<string, ReactNode>): ReactNode {
  return template.split(/(\{\w+\})/g).map((part, i) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return createElement(Fragment, { key: i }, key && key in nodes ? nodes[key] : part);
  });
}

const RELATIVE_UNITS: [number, Intl.RelativeTimeFormatUnit][] = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [4.35, "week"],
  [12, "month"],
  [Infinity, "year"],
];

// Uzbek is formatted by hand: browsers and Node ship different Uzbek locale data (a browser may
// print "M09 14" where Node prints "14-sen"), which would make server and client HTML disagree.
const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
const UZ_WEEKDAYS = ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
const UZ_UNITS: Partial<Record<Intl.RelativeTimeFormatUnit, string>> = {
  second: "soniya",
  minute: "daqiqa",
  hour: "soat",
  day: "kun",
  week: "hafta",
  month: "oy",
  year: "yil",
};
const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Calendar parts of a date in a timezone, read with en-US data that every runtime has. */
function dateParts(date: Date, timeZone: string) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  );
  return { year: p.year, month: Number(p.month), day: Number(p.day), weekday: EN_WEEKDAYS.indexOf(p.weekday), hour: p.hour, minute: p.minute };
}

function formatUz(date: Date, opts: Intl.DateTimeFormatOptions) {
  const d = dateParts(date, opts.timeZone ?? TIMEZONE);
  let out = `${d.day}-${UZ_MONTHS[d.month - 1]}`;
  if (opts.year) out += `, ${d.year}`;
  if (opts.weekday) out = `${UZ_WEEKDAYS[d.weekday]}, ${out}`;
  if (opts.hour) out += `, ${d.hour}:${d.minute}`;
  return out;
}

/** Date, relative-time and number formatting in the given language. */
export function formatters(locale: Locale) {
  const tag = INTL_LOCALE[locale];
  return {
    date(date: Date | string, opts: Intl.DateTimeFormatOptions = {}) {
      const options: Intl.DateTimeFormatOptions = { timeZone: TIMEZONE, month: "short", day: "numeric", year: "numeric", ...opts };
      return locale === "uz" ? formatUz(new Date(date), options) : new Intl.DateTimeFormat(tag, options).format(new Date(date));
    },
    /** "3 days ago" / "3 kun oldin". */
    ago(date: Date | string) {
      let value = Math.round((Date.now() - new Date(date).getTime()) / 1000);
      for (const [size, unit] of RELATIVE_UNITS) {
        if (Math.abs(value) < size) {
          const n = Math.max(1, Math.floor(value));
          return locale === "uz" ? `${n} ${UZ_UNITS[unit]} oldin` : new Intl.RelativeTimeFormat(tag).format(-n, unit);
        }
        value /= size;
      }
      return "";
    },
    /** Whole numbers with grouped thousands: 6,276 / 6 276. */
    num(n: number) {
      return Math.round(n)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, locale === "uz" ? "\u00a0" : ",");
    },
  };
}

export type Formatters = ReturnType<typeof formatters>;
