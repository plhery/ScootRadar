import { describe, expect, it } from 'vitest';
import { formatLocale } from '@/lib/formatLocale';
import type { AppLocale, TranslationKey } from '@/lib/i18n';
import {
  distanceParts,
  formatCityDistance,
  formatDistance,
  measurementSystem,
  walkEstimate,
  walkingDirectionsUrl,
  walkingMinutes,
} from '@/lib/walking';

describe('walkingMinutes', () => {
  it('rounds up at eighty metres a minute and never says zero', () => {
    expect(walkingMinutes(0)).toBe(1);
    expect(walkingMinutes(80)).toBe(1);
    expect(walkingMinutes(81)).toBe(2);
    expect(walkingMinutes(320)).toBe(4);
    expect(walkingMinutes(1000)).toBe(13);
  });
});

describe('walkEstimate', () => {
  it('has nothing to say without an origin', () => {
    expect(walkEstimate(null, 47.3769, 8.5417)).toBeNull();
  });

  it('measures from your location', () => {
    const walk = walkEstimate({ point: [47.3769, 8.5417], place: null }, 47.3779, 8.5417);
    expect(walk?.place).toBeNull();
    expect(walk?.distanceM).toBeCloseTo(111.2, 0);
  });

  it('carries the name of a searched place', () => {
    expect(walkEstimate({ point: [47.3779, 8.5403], place: 'Zürich HB' }, 47.3779, 8.5403))
      .toEqual({ distanceM: 0, place: 'Zürich HB' });
  });
});

describe('walkingDirectionsUrl', () => {
  it('asks for a walk to the point and says nothing about where it starts', () => {
    const url = new URL(walkingDirectionsUrl(45.75, 4.85));
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
    expect(Object.fromEntries(url.searchParams)).toEqual({ api: '1', destination: '45.75,4.85', travelmode: 'walking' });
  });
});

/** What useI18n() gives in this language and format region. */
function formatterFor(locale: AppLocale, region?: string) {
  return {
    locale,
    region,
    t: (key: TranslationKey, values?: Record<string, string | number>) => `${values?.count} ${key === 'distance.meters' ? 'm' : 'km'}`,
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      new Intl.NumberFormat(formatLocale(locale, region), options).format(value),
  };
}

// Intl separates a number and its unit with a no-break space.
const plain = (text: string) => text.replace(/[\u00a0\u202f]/g, ' ');

describe('formatDistance', () => {
  const formatter = formatterFor('en');

  it('shows whole metres below a kilometre', () => {
    expect(formatDistance(126.4, formatter)).toBe('126 m');
    expect(formatDistance(999.4, formatter)).toBe('999 m');
  });

  it('shows kilometres from there, with a decimal only when it says something', () => {
    expect(formatDistance(1000, formatter)).toBe('1 km');
    expect(formatDistance(1449, formatter)).toBe('1.4 km');
    expect(formatDistance(24_000, formatter)).toBe('24 km');
  });
});

describe('measurementSystem', () => {
  it('measures in miles in the US, Liberia, Myanmar and the UK, in metres everywhere else', () => {
    expect(['US', 'LR', 'MM'].map(measurementSystem)).toEqual(['us', 'us', 'us']);
    expect(measurementSystem('GB')).toBe('uk');
    expect(['CH', 'CA', 'MX', 'IE', '419', undefined].map(measurementSystem)).toEqual(Array(6).fill('metric'));
  });
});

describe('distances where the region measures in miles', () => {
  // The same lengths as ScooterModelsTests.testLengthsAreInMilesWhereTheRegionMeasuresInMiles on iOS.
  const lengths: [number, string, string][] = [
    [2, '7 ft', '2 yd'], [12, '40 ft', '10 yd'], [80, '250 ft', '90 yd'],
    [100, '350 ft', '100 yd'], [300, '1,000 ft', '350 yd'], [800, '2,600 ft', '850 yd'],
    [805, '0.5 mi', '0.5 mi'], [1000, '0.62 mi', '0.62 mi'], [3000, '1.9 mi', '1.9 mi'],
    [14_000, '8.7 mi', '8.7 mi'], [61_000, '38 mi', '38 mi'],
  ];

  it('gives feet in the US and yards in the UK under half a mile, then miles, as iOS does on roads', () => {
    for (const [meters, us, uk] of lengths) {
      expect(plain(formatDistance(meters, formatterFor('en', 'US'))), `${meters} m`).toBe(us);
      expect(plain(formatDistance(meters, formatterFor('en', 'GB'))), `${meters} m`).toBe(uk);
    }
  });

  it('names the units in the UI language', () => {
    expect(plain(formatDistance(300, formatterFor('fr', 'US')))).toBe('1 000 pi');
    expect(plain(formatDistance(3000, formatterFor('es', 'US')))).toBe('1.9 mi');
    expect(plain(formatDistance(3000, formatterFor('nb', 'GB')))).toBe('1,9 miles');
  });

  it('splits the number from its unit', () => {
    expect(distanceParts(300, formatterFor('en', 'US'))).toEqual({ value: '1,000', unit: 'ft' });
    expect(distanceParts(14_000, formatterFor('en', 'GB'))).toEqual({ value: '8.7', unit: 'mi' });
    expect(distanceParts(320, formatterFor('en', 'CH'))).toEqual({ value: '320', unit: 'm' });
    expect(distanceParts(1449, formatterFor('en'))).toEqual({ value: '1.4', unit: 'km' });
  });

  it('leaves Switzerland and Canada in metres', () => {
    expect(formatDistance(300, formatterFor('en', 'CH'))).toBe('300 m');
    expect(formatDistance(1449, formatterFor('fr', 'CA'))).toBe('1,4 km');
    expect(formatDistance(800, formatterFor('es', 'MX'))).toBe('800 m');
  });
});

describe('formatCityDistance', () => {
  it('rounds to whole kilometres, or whole miles, and never shows zero', () => {
    expect(formatCityDistance(61_400, formatterFor('en'))).toBe('61 km');
    expect(formatCityDistance(61_500, formatterFor('en'))).toBe('62 km');
    expect(formatCityDistance(300, formatterFor('en', 'CH'))).toBe('1 km');
    expect(plain(formatCityDistance(61_400, formatterFor('en', 'US')))).toBe('38 mi');
    expect(plain(formatCityDistance(300, formatterFor('en', 'GB')))).toBe('1 mi');
  });
});
