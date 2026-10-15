import { describe, expect, it } from 'vitest';
import { DEFAULT_FORMAT_REGION, formatLocale, formatRegion, placeNameLanguage } from '@/lib/formatLocale';
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

  it('takes the region of a first browser language the app is not shown in, or its likely one', () => {
    // Chrome's defaults in Israel, Japan, Poland, Hungary and Greece.
    expect(formatRegion('en', ['he-IL', 'he', 'en-US', 'en'])).toBe('IL');
    expect(formatRegion('en', ['ja', 'en-US', 'en'])).toBe('JP');
    expect(formatRegion('en', ['pl-PL', 'pl', 'en-US', 'en'])).toBe('PL');
    expect(formatRegion('en', ['hu-HU', 'hu', 'en-US', 'en'])).toBe('HU');
    expect(formatRegion('en', ['el', 'en-US'])).toBe('GR');
    expect(formatRegion('en', ['ar', 'en'])).toBe('EG');
    expect(formatRegion('de', ['pl-PL', 'de-DE'])).toBe('PL');
    // A first language the app has keeps the rule above.
    expect(formatRegion('en', ['en-US', 'he-IL'])).toBe('US');
    expect(formatRegion('de', ['de-CH', 'en-US'])).toBe('CH');
    expect(formatRegion('en', ['fr-FR', 'en-US'])).toBe('US');
    expect(formatRegion('nb', ['nn', 'en-US'])).toBe('CH');
    expect(formatRegion('en', ['not a tag', 'he-IL', 'en-US'])).toBe('IL');
  });

  it('falls back to Switzerland, as before, when no language names a region for the UI language', () => {
    expect(DEFAULT_FORMAT_REGION).toBe('CH');
    expect(formatRegion('en', [])).toBe('CH');
    expect(formatRegion('en', ['en'])).toBe('CH');
    expect(formatRegion('it', ['en-US', 'fr-CA'])).toBe('CH');
    expect(formatRegion('en', ['not a tag', '*'])).toBe('CH');
  });
});

describe('placeNameLanguage', () => {
  it('is the first browser language where the app is not shown in it, else the UI language', () => {
    expect(placeNameLanguage('en', ['el-GR', 'el', 'en-US'])).toBe('el');
    expect(placeNameLanguage('en', ['he-IL', 'he', 'en-US', 'en'])).toBe('he');
    expect(placeNameLanguage('en', ['ja', 'en-US'])).toBe('ja');
    expect(placeNameLanguage('en', ['en-US', 'he-IL'])).toBe('en');
    expect(placeNameLanguage('de', ['de-CH'])).toBe('de');
    // A UI language chosen over the browser's first one the app has.
    expect(placeNameLanguage('en', ['fr-FR', 'en-US'])).toBe('en');
    expect(placeNameLanguage('nb', ['no-NO', 'en'])).toBe('nb');
    expect(placeNameLanguage('en', [])).toBe('en');
    expect(placeNameLanguage('en', ['*', 'el'])).toBe('el');
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

  it('writes English as Israel, the Gulf and New Zealand do, for a browser in Hebrew, Arabic or English there', () => {
    expect(plain(formatRidePrice(550, 'ILS', 'en', 'IL'))).toBe('₪5.50');
    expect(plain(formatClockTime(EVENING, 'en', 'IL'))).toBe('23:05');
    expect(plain(formatRidePrice(550, 'AED', 'en', 'AE'))).toBe('AED 5.50');
    expect(plain(formatClockTime(EVENING, 'en', 'AE'))).toBe('11:05 PM');
    expect(plain(formatRidePrice(550, 'SAR', 'en', 'SA'))).toBe('SAR 5.50');
    expect(plain(formatRidePrice(550, 'NZD', 'en', 'NZ'))).toBe('$5.50');
    expect(plain(formatClockTime(EVENING, 'en', 'PL'))).toBe('23:05');
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
