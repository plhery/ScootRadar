import { describe, expect, it } from 'vitest';
import type { TranslationKey } from '@/lib/i18n';
import { formatClockTime, formatUiText, isSingular, type UiTextFormatter } from '@/lib/uiText';

// Echoes the key and its values, so the test shows what reaches the dictionary.
const i18n: UiTextFormatter = {
  locale: 'de',
  t: (key: TranslationKey, values = {}) =>
    [key, ...Object.entries(values).map(([name, value]) => `${name}=${value}`)].join(' '),
  formatNumber: value => new Intl.NumberFormat('de-CH').format(value),
};

// Built in local time, so the expectations hold in any time zone.
const AT = new Date(2026, 9, 3, 14, 2).getTime();

describe('formatClockTime', () => {
  it('shows hours and minutes on the 24-hour clock in every app language', () => {
    for (const locale of ['de', 'fr', 'it', 'nl', 'nb', 'pt', 'es', 'is', 'en'] as const) {
      expect(formatClockTime(AT, locale)).toBe('14:02');
    }
    expect(formatClockTime(new Date(2026, 9, 3, 7, 5).getTime(), 'en')).toBe('07:05');
  });

  it('tells the time of a place by its clock, and names its time zone where the device\'s clock reads otherwise', () => {
    const device = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Fourteen hours ahead of UTC, or eleven behind where the device is fourteen ahead.
    const [elsewhere, offset] = new Date(AT).getTimezoneOffset() === -840 ? ['Pacific/Pago_Pago', 'GMT-11'] : ['Pacific/Kiritimati', 'GMT+14'];
    const there = new Date(AT).toLocaleTimeString('en-GB', { timeZone: elsewhere, hour: '2-digit', minute: '2-digit' });

    expect(formatClockTime(AT, 'en', 'CH', device)).toBe('14:02');
    expect(formatClockTime(AT, 'en', 'CH', elsewhere)).toBe(`${there} ${offset}`);
    expect(formatClockTime(AT, 'en', 'US', elsewhere)).toMatch(/^\d{1,2}:\d{2}\s[AP]M GMT[+-]1[14]$/);
    // A zone the browser does not know: the device's clock, as before.
    expect(formatClockTime(AT, 'en', 'CH', 'Mars/Olympus_Mons')).toBe('14:02');
  });

  it('passes the time zone of a sentence on to its time', () => {
    const elsewhere = new Date(AT).getTimezoneOffset() === -840 ? 'Pacific/Pago_Pago' : 'Pacific/Kiritimati';
    expect(formatUiText({ key: 'dock.curfew', values: { city: 'Oslo' }, time: AT, timeZone: elsewhere }, i18n))
      .toBe(`dock.curfew city=Oslo time=${formatClockTime(AT, 'de', undefined, elsewhere)}`);
  });
});

describe('formatUiText', () => {
  it('passes a plain key through', () => {
    expect(formatUiText({ key: 'dock.live' }, i18n)).toBe('dock.live');
  });

  it('substitutes names as they are', () => {
    expect(formatUiText({ key: 'dock.down.two', values: { first: 'Bird', second: 'Dott' } }, i18n))
      .toBe('dock.down.two first=Bird second=Dott');
  });

  it('formats numbers for the locale', () => {
    const grouped = new Intl.NumberFormat('de-CH').format(5412);
    expect(grouped).not.toBe('5412');
    expect(formatUiText({ key: 'dock.truncated', numbers: { shown: 2000, total: 5412 } }, i18n))
      .toBe(`dock.truncated shown=${new Intl.NumberFormat('de-CH').format(2000)} total=${grouped}`);
  });

  it('turns the time into a clock time', () => {
    expect(formatUiText({ key: 'dock.refreshFailed', time: AT }, i18n)).toBe('dock.refreshFailed time=14:02');
  });

  it('takes the singular form of a sentence about a count where the language uses it', () => {
    const scooters = (count: number) => ({ key: 'dock.onMap.other', one: { key: 'dock.onMap.one', count } }) as const;
    const french = { ...i18n, locale: 'fr' } as const;
    // German: one, and nothing else.
    expect(formatUiText(scooters(1), i18n)).toBe('dock.onMap.one');
    expect(formatUiText(scooters(0), i18n)).toBe('dock.onMap.other');
    expect(formatUiText(scooters(2), i18n)).toBe('dock.onMap.other');
    // French: none as well, "0 trottinette sur cette carte".
    expect(formatUiText(scooters(0), french)).toBe('dock.onMap.one');
    expect(formatUiText(scooters(1), french)).toBe('dock.onMap.one');
    expect(formatUiText(scooters(2), french)).toBe('dock.onMap.other');
    expect(formatUiText(scooters(5412), french)).toBe('dock.onMap.other');
  });
});

describe('formatUiText with parts', () => {
  it('formats each part as a sentence of its own, with its own count and form, before substituting it', () => {
    const counted = (key: 'cities' | 'countries', count: number) => ({
      key: `coverage.${key}.other`, numbers: { count }, one: { key: `coverage.${key}.one`, count },
    }) as const;
    const icelandic = { ...i18n, locale: 'is' } as const;
    const text = (cities: number, countries: number) =>
      ({ key: 'coverage.body', parts: { cities: counted('cities', cities), countries: counted('countries', countries) } }) as const;

    expect(formatUiText(text(1, 2), i18n))
      .toBe('coverage.body cities=coverage.cities.one count=1 countries=coverage.countries.other count=2');
    expect(formatUiText(text(21, 22), icelandic))
      .toBe('coverage.body cities=coverage.cities.one count=21 countries=coverage.countries.other count=22');
    expect(formatUiText(text(5412, 21), i18n))
      .toBe(`coverage.body cities=coverage.cities.other count=${new Intl.NumberFormat('de-CH').format(5412)} countries=coverage.countries.other count=21`);
  });
});

describe('isSingular', () => {
  it('is true for one in every app language, and for none only in French', () => {
    for (const locale of ['en', 'de', 'fr', 'it', 'nl', 'nb', 'pt', 'es', 'is'] as const) {
      expect(isSingular(1, locale)).toBe(true);
      expect(isSingular(2, locale)).toBe(false);
      expect(isSingular(1000, locale)).toBe(false);
      expect(isSingular(0, locale)).toBe(locale === 'fr');
    }
  });

  it('is true in Icelandic for a count ending in one, except eleven', () => {
    for (const count of [21, 31, 101, 1001]) expect(isSingular(count, 'is')).toBe(true);
    for (const count of [11, 111, 20]) expect(isSingular(count, 'is')).toBe(false);
    expect(isSingular(21, 'pt')).toBe(false);
  });
});
