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
 * and no leading zero on a 12-hour one.
 */
export function formatClockTime(time: number, locale: AppLocale, region?: string): string {
  const tag = formatLocale(locale, region);
  const { hourCycle } = new Intl.DateTimeFormat(tag, { hour: 'numeric' }).resolvedOptions();
  const twelveHour = hourCycle === 'h11' || hourCycle === 'h12';
  return new Date(time).toLocaleTimeString(tag, { hour: twelveHour ? 'numeric' : '2-digit', minute: '2-digit' });
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

export function formatUiText(text: UiText, formatter: UiTextFormatter): string {
  const { locale, region, t, formatNumber } = formatter;
  const values: Record<string, string | number> = { ...text.values };
  for (const [name, value] of Object.entries(text.numbers ?? {})) values[name] = formatNumber(value);
  if (text.time !== undefined) values.time = formatClockTime(text.time, locale, region);
  for (const [name, part] of Object.entries(text.parts ?? {})) values[name] = formatUiText(part, formatter);
  return t(text.one && isSingular(text.one.count, locale) ? text.one.key : text.key, values);
}
