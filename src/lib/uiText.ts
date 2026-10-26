import { formatLocale } from '@/lib/formatLocale';
import type { AppLocale, TranslationKey } from '@/lib/i18n';

/** A sentence and its raw values, so the logic that picks it stays free of React and locale. */
export interface UiText {
  key: TranslationKey;
  /** Substituted as they are, e.g. provider names. */
  values?: Record<string, string>;
  /** Formatted for the locale before they are substituted. */
  numbers?: Record<string, number>;
  /** Epoch milliseconds, substituted for {time} as a clock time. */
  time?: number;
  /** The time zone of a place {time} is told for, by whose clock it is told: see formatClockTime. */
  timeZone?: string;
  /** {time} is of another day: the day of the week stands before it, "Fri 14:05". */
  weekday?: boolean;
  /** 1 for January, substituted for {month} as the month's name: "April", "avril". */
  month?: number;
  /** A day of the year, "MM-DD", substituted for {date} as the day and the month's name: "15 December", "15. Dezember". */
  date?: string;
  /**
   * For a sentence about a count: its singular form, which takes the place of
   * `key` where the language shown uses the singular for that count.
   */
  one?: { key: TranslationKey; count: number };
  /**
   * Phrases of their own, formatted like this one and substituted for their
   * name, so that each count of a sentence about two takes its own form:
   * "{cities} in {countries}".
   */
  parts?: Record<string, UiText>;
}

/** The value of useI18n() satisfies this. */
export interface UiTextFormatter {
  locale: AppLocale;
  /** The format region, Switzerland when absent; see formatLocale.ts. */
  region?: string;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
  formatNumber: (value: number) => string;
}

/**
 * "09:05" and "23:05" in Switzerland, "9:05 AM" and "11:05 PM" in the US,
 * "23 h 05" in Quebec: two-digit hours on a 24-hour clock, as iOS writes them,
 * and no leading zero on a 12-hour one. For a place in another time zone, given,
 * the time by the place's clock, named after it where the device's clock reads
 * otherwise: Oslo's night ban ends at "05:00 GMT+2" seen from New York.
 */
export function formatClockTime(time: number, locale: AppLocale, region?: string, timeZone?: string, weekday = false): string {
  const tag = formatLocale(locale, region);
  const { hourCycle } = new Intl.DateTimeFormat(tag, { hour: 'numeric' }).resolvedOptions();
  const twelveHour = hourCycle === 'h11' || hourCycle === 'h12';
  const zone = timeZone && clockDiffers(time, timeZone) ? { timeZone, timeZoneName: 'short' as const } : {};
  return new Date(time).toLocaleTimeString(tag, { hour: twelveHour ? 'numeric' : '2-digit', minute: '2-digit',
    ...(weekday ? { weekday: 'short' as const } : {}), ...zone });
}

/** Whether a time zone's clock reads otherwise than the device's at that instant; not for one the browser does not know. */
function clockDiffers(time: number, timeZone: string): boolean {
  const clock = (zone?: string) =>
    new Date(time).toLocaleString('en-GB', { timeZone: zone, day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  try {
    return clock(timeZone) !== clock();
  } catch {
    return false;
  }
}

/**
 * Whether a count takes the singular in this language: 1 in all of them, 0 as
 * well in French ("0 trottinette"), and 21, 31, 101 and so on in Icelandic. The
 * logic that picks a sentence does not know the language, so this is decided
 * where the sentence is written.
 */
export function isSingular(count: number, locale: AppLocale): boolean {
  // Plain "pt" follows Brazil, where 0 is singular too; the app is written for Portugal.
  return new Intl.PluralRules(locale === 'pt' ? 'pt-PT' : locale).select(count) === 'one';
}

/** The month's name in the language, as it stands in a sentence: "April", "avril". 1 is January. */
export function formatMonth(month: number, locale: AppLocale, region?: string): string {
  return new Intl.DateTimeFormat(formatLocale(locale, region), { month: 'long', timeZone: 'UTC' })
    .format(Date.UTC(2001, month - 1, 15));
}

/** A day of the year, "MM-DD", as the language and region write it: "15 December", "December 15" in the US. */
export function formatDayOfYear(date: string, locale: AppLocale, region?: string): string {
  return new Intl.DateTimeFormat(formatLocale(locale, region), { day: 'numeric', month: 'long', timeZone: 'UTC' })
    .format(Date.UTC(2001, Number(date.slice(0, 2)) - 1, Number(date.slice(3, 5))));
}

export function formatUiText(text: UiText, formatter: UiTextFormatter): string {
  const { locale, region, t, formatNumber } = formatter;
  const values: Record<string, string | number> = { ...text.values };
  for (const [name, value] of Object.entries(text.numbers ?? {})) values[name] = formatNumber(value);
  if (text.time !== undefined) values.time = formatClockTime(text.time, locale, region, text.timeZone, text.weekday);
  if (text.month !== undefined) values.month = formatMonth(text.month, locale, region);
  if (text.date !== undefined) values.date = formatDayOfYear(text.date, locale, region);
  for (const [name, part] of Object.entries(text.parts ?? {})) values[name] = formatUiText(part, formatter);
  return t(text.one && isSingular(text.one.count, locale) ? text.one.key : text.key, values);
}
