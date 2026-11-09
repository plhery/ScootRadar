import { describe, expect, it } from 'vitest';
import { BATTERY_PRESETS, batteryLevel, batteryPresetLabel, batteryReach, formatBatteryReach, snapBatteryPreset } from '@/lib/battery';
import { formatLocale } from '@/lib/formatLocale';
import { translate, type AppLocale } from '@/lib/i18n';
import type { UnitsChoice } from '@/lib/walking';

describe('battery presets', () => {
  it('offers any, 30, 60 and 80 percent', () => {
    expect(BATTERY_PRESETS).toEqual([0, 30, 60, 80]);
  });

  it('keeps a preset as it is', () => {
    for (const preset of BATTERY_PRESETS) expect(snapBatteryPreset(preset)).toBe(preset);
  });

  it('snaps other values down, never up', () => {
    expect(snapBatteryPreset(45)).toBe(30);
    expect(snapBatteryPreset(95)).toBe(80);
    expect(snapBatteryPreset(100)).toBe(80);
    expect(snapBatteryPreset(79.9)).toBe(60);
    expect(snapBatteryPreset(59)).toBe(30);
    expect(snapBatteryPreset(29)).toBe(0);
    expect(snapBatteryPreset(5)).toBe(0);
  });

  it('treats values outside the range and non-numbers as the nearest end', () => {
    expect(snapBatteryPreset(-20)).toBe(0);
    expect(snapBatteryPreset(250)).toBe(80);
    expect(snapBatteryPreset(Infinity)).toBe(80);
    expect(snapBatteryPreset(NaN)).toBe(0);
  });

  it('labels the minimums the same in every language', () => {
    expect(BATTERY_PRESETS.map(batteryPresetLabel)).toEqual([null, '30%+', '60%+', '80%+']);
  });
});

describe('batteryLevel', () => {
  it('is good from 50, low from 20 to 49 and critical below 20', () => {
    expect(batteryLevel(100)).toBe('good');
    expect(batteryLevel(50)).toBe('good');
    expect(batteryLevel(49)).toBe('low');
    expect(batteryLevel(20)).toBe('low');
    expect(batteryLevel(19)).toBe('critical');
    expect(batteryLevel(0)).toBe('critical');
  });
});

describe('how far the battery chosen usually takes the scooters in view', () => {
  const all = () => true;
  // Stuttgart on 9 November 2026: Lime's ranges top out at 11.5 km, Voi's are 80 km a full battery.
  const fullRanges = { lime: 11_500, voi: 80_000, bolt: 61_000 };

  it('is the full range of the one app in view, scaled to the minimum', () => {
    expect(batteryReach(100, fullRanges, { voi: 40 }, all)).toEqual({ low: 80_000, high: 80_000, mean: 80_000 });
    expect(batteryReach(30, fullRanges, { voi: 40 }, all)).toEqual({ low: 24_000, high: 24_000, mean: 24_000 });
  });

  it('spans the apps switched on in view, leaving out those switched off or with none in view', () => {
    expect(batteryReach(100, fullRanges, { lime: 30, voi: 10, bolt: 0 }, all)).toEqual({ low: 11_500, high: 80_000, mean: 28_625 });
    expect(batteryReach(100, fullRanges, { lime: 30, voi: 10 }, provider => provider !== 'voi')).toMatchObject({ low: 11_500, high: 11_500 });
    expect(batteryReach(100, fullRanges, { dott: 30 }, all)).toBeNull();
    expect(batteryReach(100, {}, { lime: 30 }, all)).toBeNull();
  });

  it('leaves out an app with under a tenth of the scooters, unless it has the most', () => {
    expect(batteryReach(100, fullRanges, { lime: 95, voi: 5 }, all)).toEqual({ low: 11_500, high: 11_500, mean: 11_500 });
    expect(batteryReach(100, fullRanges, { lime: 90, voi: 10 }, all)).toMatchObject({ low: 11_500, high: 80_000 });
    const many = Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`app${index}`, 10_000 + index * 1000]));
    const counts = Object.fromEntries(Object.keys(many).map((provider, index) => [provider, index === 3 ? 9 : 8]));
    expect(batteryReach(100, many, counts, all)).toEqual({ low: 13_000, high: 13_000, mean: 13_000 });
  });

  /** What useI18n() gives in this language and format region, with the units chosen in the settings. */
  const formatter = (locale: AppLocale, region?: string, units?: UnitsChoice) => ({
    locale, region, units,
    t: (key: Parameters<typeof translate>[1], values?: Record<string, string | number>) => translate(locale, key, values, region),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(formatLocale(locale, region), options).format(value),
  });
  const plain = (text: string) => text.replace(/[\u00a0\u202f]/g, ' ');

  it('is written in whole kilometres, as one length where the apps\' are within a quarter of each other', () => {
    expect(formatBatteryReach({ low: 24_000, high: 24_000, mean: 24_000 }, formatter('en', 'CH'))).toBe('24 km');
    expect(formatBatteryReach({ low: 40_000, high: 50_000, mean: 44_600 }, formatter('en', 'CH'))).toBe('45 km');
    expect(formatBatteryReach({ low: 11_500, high: 80_000, mean: 28_625 }, formatter('en', 'CH'))).toBe('12–80 km');
    expect(plain(formatBatteryReach({ low: 3450, high: 24_000, mean: 9000 }, formatter('de', 'DE')))).toBe('3–24 km');
    // Never 0: 30% of the shortest full range seen, 1.2 km, is "1 km".
    expect(formatBatteryReach({ low: 300, high: 300, mean: 300 }, formatter('en', 'CH'))).toBe('1 km');
  });

  it('is written in whole miles where lengths are in miles', () => {
    expect(plain(formatBatteryReach({ low: 80_000, high: 80_000, mean: 80_000 }, formatter('en', 'US')))).toBe('50 mi');
    expect(plain(formatBatteryReach({ low: 11_500, high: 80_000, mean: 28_625 }, formatter('en', 'CH', 'imperial')))).toBe('7–50 mi');
    expect(plain(formatBatteryReach({ low: 11_500, high: 80_000, mean: 28_625 }, formatter('en', 'US', 'metric')))).toBe('12–80 km');
  });

  it('makes the line under the battery choice in each language', () => {
    const line = (locale: AppLocale, region: string) => plain(translate(locale, 'filter.batteryReach',
      { percent: new Intl.NumberFormat(formatLocale(locale, region)).format(100),
        length: formatBatteryReach({ low: 45_000, high: 45_000, mean: 45_000 }, formatter(locale, region)) }, region));
    expect(line('en', 'GB')).toBe('100% usually allows about 28 mi.');
    expect(line('en', 'CH')).toBe('100% usually allows about 45 km.');
    expect(line('de', 'DE')).toBe('Mit 100% kommt man meist etwa 45 km weit.');
    expect(line('fr', 'FR')).toBe('Avec 100 %, comptez en général environ 45 km.');
    expect(line('nb', 'NO')).toBe('Med 100% kommer du vanligvis rundt 45 km.');
  });
});
