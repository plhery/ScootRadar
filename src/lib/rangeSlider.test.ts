import { describe, expect, it } from 'vitest';
import { formatLocale } from '@/lib/formatLocale';
import type { AppLocale, TranslationKey } from '@/lib/i18n';
import { formatMinimumRange, rangeScale, rangeSteps, rangeStepsMeters, snapMinimumRange } from '@/lib/rangeSlider';
import type { UnitsChoice } from '@/lib/walking';

describe('the range slider', () => {
  it('runs to 30 km in kilometres, and to 20 mi in miles, with feet or yards', () => {
    expect(rangeScale('metric')).toEqual({ unit: 'kilometer', max: 30 });
    expect(rangeScale('us')).toEqual({ unit: 'mile', max: 20 });
    expect(rangeScale('uk')).toEqual({ unit: 'mile', max: 20 });
  });

  it('keeps whole kilometres in metres, and whole miles rounded to the metre', () => {
    expect(rangeStepsMeters(5, 'metric')).toBe(5000);
    expect(rangeStepsMeters(1, 'us')).toBe(1609);
    expect(rangeStepsMeters(3, 'uk')).toBe(4828);
    expect(rangeStepsMeters(20, 'us')).toBe(32_187);
  });

  it('snaps a minimum to the nearest whole step of the units in use', () => {
    // 5 km in miles is 3.1 mi: "3 mi+" means 4,828 m, and back in kilometres, 5 km again.
    expect(snapMinimumRange(5000, 'us')).toBe(4828);
    expect(snapMinimumRange(4828, 'metric')).toBe(5000);
    expect(snapMinimumRange(1609, 'metric')).toBe(2000);
    expect(snapMinimumRange(2000, 'uk')).toBe(1609);
    expect(rangeSteps(4828, 'us')).toBe(3);
    expect(rangeSteps(5400, 'metric')).toBe(5);
    expect(rangeSteps(5500, 'metric')).toBe(6);
  });

  it('keeps a minimum no further than the slider goes, and none below half a step', () => {
    expect(snapMinimumRange(45_000, 'metric')).toBe(30_000);
    expect(snapMinimumRange(45_000, 'us')).toBe(32_187);
    expect(snapMinimumRange(Infinity, 'metric')).toBe(30_000);
    expect(snapMinimumRange(499, 'metric')).toBe(0);
    expect(snapMinimumRange(-3000, 'metric')).toBe(0);
    expect(snapMinimumRange(NaN, 'us')).toBe(0);
  });
});

describe('formatMinimumRange', () => {
  const formatter = (locale: AppLocale, region: string, units?: UnitsChoice) => ({
    locale, region, units,
    t: (key: TranslationKey, values?: Record<string, string | number>) => `${values?.count} ${key === 'distance.meters' ? 'm' : 'km'}`,
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(formatLocale(locale, region), options).format(value),
  });
  const plain = (text: string | null) => text?.replace(/[  ]/g, ' ') ?? null;

  it('writes whole kilometres or whole miles, as the units in use have it, and nothing for none', () => {
    expect(formatMinimumRange(5000, formatter('en', 'CH'))).toBe('5 km');
    expect(plain(formatMinimumRange(5000, formatter('en', 'US')))).toBe('3 mi');
    expect(plain(formatMinimumRange(4828, formatter('en', 'GB')))).toBe('3 mi');
    expect(formatMinimumRange(0, formatter('en', 'US'))).toBeNull();
  });

  it('follows the units chosen in the settings over the region', () => {
    expect(formatMinimumRange(4828, formatter('en', 'US', 'metric'))).toBe('5 km');
    expect(plain(formatMinimumRange(5000, formatter('de', 'DE', 'imperial')))).toBe('3 mi');
    // In the UI language's short name for miles, as walking distances are.
    expect(plain(formatMinimumRange(5000, formatter('nb', 'NO', 'imperial')))).toBe('3 miles');
  });
});
