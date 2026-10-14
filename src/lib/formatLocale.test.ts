import { describe, expect, it } from 'vitest';
import { DEFAULT_FORMAT_REGION, formatLocale, formatRegion } from '@/lib/formatLocale';
import { formatRidePrice } from '@/lib/ridePrice';
import { formatClockTime } from '@/lib/uiText';

// Intl separates amount and currency, and a time and its AM or PM, with no-break spaces.
const plain = (text: string) => text.replace(/[  ]/g, ' ');
// Built in local time, so the expectations hold in any time zone.
const EVENING = new Date(2026, 9, 14, 23, 5).getTime();
const MORNING = new Date(2026, 9, 14, 7, 5).getTime();

describe('formatRegion', () => {
  it('takes the region of the first browser language that is the UI language', () => {
    expect(formatRegion('en', ['en-US', 'fr-FR'])).toBe('US');
    expect(formatRegion('fr', ['en-US', 'fr-CA', 'fr-FR'])).toBe('CA');
    expect(formatRegion('es', ['es-MX'])).toBe('MX');
    expect(formatRegion('es', ['es-419', 'en'])).toBe('419');
    expect(formatRegion('de', ['de-at'])).toBe('AT');
  });

  it('skips languages without a region and reads Norwegian however the browser writes it', () => {
    expect(formatRegion('en', ['en', 'en-GB'])).toBe('GB');
    expect(formatRegion('nb', ['no-NO'])).toBe('NO');
    expect(formatRegion('nb', ['nn-NO'])).toBe('NO');
  });

  it('falls back to Switzerland, as before, when no language names a region for the UI language', () => {
    expect(DEFAULT_FORMAT_REGION).toBe('CH');
    expect(formatRegion('en', [])).toBe('CH');
    expect(formatRegion('en', ['en'])).toBe('CH');
    expect(formatRegion('it', ['en-US', 'fr-CA'])).toBe('CH');
    expect(formatRegion('en', ['not a tag', '*'])).toBe('CH');
  });
});

describe('formatLocale', () => {
  it('joins the UI language and the region', () => {
    expect(formatLocale('en', 'US')).toBe('en-US');
    expect(formatLocale('fr', 'CA')).toBe('fr-CA');
    expect(formatLocale('de')).toBe('de-CH');
  });

  it('writes numbers, prices and times as North America does', () => {
    expect(new Intl.NumberFormat(formatLocale('en', 'US')).format(12345.6)).toBe('12,345.6');
    expect(plain(formatRidePrice(150, 'USD', 'en', 'US'))).toBe('$1.50');
    expect(plain(formatClockTime(EVENING, 'en', 'US'))).toBe('11:05 PM');
    expect(plain(formatClockTime(MORNING, 'en', 'US'))).toBe('7:05 AM');

    expect(plain(new Intl.NumberFormat(formatLocale('fr', 'CA')).format(12345.6))).toBe('12 345,6');
    expect(plain(formatRidePrice(150, 'CAD', 'fr', 'CA'))).toBe('1,50 $');
    expect(plain(formatClockTime(EVENING, 'fr', 'CA'))).toBe('23 h 05');

    expect(new Intl.NumberFormat(formatLocale('es', 'MX')).format(12345.6)).toBe('12,345.6');
    expect(plain(formatRidePrice(150, 'MXN', 'es', 'MX'))).toBe('$1.50');
    expect(plain(formatClockTime(EVENING, 'es', 'MX'))).toBe('11:05 p.m.');
  });

  it('writes them as Switzerland does without a region, as every visitor saw before', () => {
    // ICU versions differ on the Swiss apostrophe.
    expect(new Intl.NumberFormat(formatLocale('de')).format(12345.6)).toMatch(/^12['’]345\.6$/);
    expect(new Intl.NumberFormat(formatLocale('it')).format(12345.6)).toMatch(/^12['’]345\.6$/);
    expect(new Intl.NumberFormat(formatLocale('fr')).format(12345.6)).toMatch(/^12['’]345,6$/);
    expect(plain(formatRidePrice(150, 'CHF', 'de'))).toBe('CHF 1.50');
    expect(plain(formatRidePrice(150, 'CHF', 'fr'))).toBe('1.50 CHF');
    expect(plain(formatRidePrice(150, 'CHF', 'it'))).toBe('CHF 1.50');
    for (const language of ['de', 'fr', 'it'] as const) {
      expect(formatClockTime(EVENING, language)).toBe('23:05');
      expect(formatClockTime(MORNING, language)).toBe('07:05');
      expect(formatClockTime(EVENING, language, 'CH')).toBe('23:05');
    }
  });
});
