import { describe, expect, it } from 'vitest';
import { formatLocale } from '@/lib/formatLocale';
import { translate, type AppLocale, type TranslationKey } from '@/lib/i18n';
import { formatMinimumRange, rangeFilterHelp, rangeScale, rangeSteps, rangeStepsMeters, snapMinimumRange } from '@/lib/rangeSlider';
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

describe('the paragraph under the range slider', () => {
  const formatter = (locale: AppLocale, region = 'CH', units?: UnitsChoice) => ({
    locale, region, units,
    t: (key: TranslationKey, values?: Record<string, string | number>) => translate(locale, key, values, region),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => new Intl.NumberFormat(formatLocale(locale, region), options).format(value),
  });
  const swiss = { lime: 11_500, bolt: 29_400, voi: 72_800 };
  const all = () => true;
  const help = (minRange: number, ranges: Record<string, number> = swiss, enabled: (provider: string) => boolean = all,
    format = formatter('en')) => rangeFilterHelp(minRange, ranges, enabled, format)?.replace(/\u00a0/g, '~') ?? null;
  const last = 'Scooters without range or battery info are hidden while a minimum is set.';

  it('says what battery each app’s scooters that report only a battery need, from the lowest', () => {
    expect(help(6000)).toBe(`Scooters that only report a battery need at least 9% (Voi), 21% (Bolt) and 53% (Lime). ${last}`);
    // 3 mi, 4,828 m.
    expect(help(4828, swiss, all, formatter('en', 'US'))).toBe(
      'Scooters that only report a battery need at least 7% (Voi), 17% (Bolt), and 42% (Lime). ' + last);
    expect(help(4828, swiss, all, formatter('en', 'CH', 'imperial')))
      .toBe(`Scooters that only report a battery need at least 7% (Voi), 17% (Bolt) and 42% (Lime). ${last}`);
  });

  it('says whose are all hidden where even a full battery may not get there, in the units of the slider', () => {
    expect(help(12_000)).toBe('Scooters that only report a battery need at least 17% (Voi) and 41% (Bolt). ' +
      `Scooters from Lime that only report a battery are hidden, as a full battery may not reach 12 km. ${last}`);
    // 8 mi, 12,875 m: Lime's would need 112%.
    expect(help(12_875, swiss, all, formatter('en', 'CH', 'imperial'))).toBe(
      'Scooters that only report a battery need at least 18% (Voi) and 44% (Bolt). ' +
      `Scooters from Lime that only report a battery are hidden, as a full battery may not reach 8 mi. ${last}`);
    expect(help(30_000, { lime: 11_500, bolt: 29_400 })).toBe(
      `Scooters from Bolt and Lime that only report a battery are hidden, as a full battery may not reach 30 km. ${last}`);
  });

  it('leaves out the apps switched off', () => {
    expect(help(6000, swiss, provider => provider !== 'bolt'))
      .toBe(`Scooters that only report a battery need at least 9% (Voi) and 53% (Lime). ${last}`);
    expect(help(6000, swiss, () => false)).toBe(last);
  });

  it('names together the apps that need the same battery, in the filters’ order', () => {
    expect(help(3000, { voi: 72_800, beam: 10_000, jet: 10_000 }))
      .toBe(`Scooters that only report a battery need at least 5% (Voi) and 30% (JET and Beam). ${last}`);
  });

  it('says only that the scooters reporting neither are hidden where every app gives a range, and nothing for Any', () => {
    expect(help(6000, {})).toBe(last);
    expect(help(0)).toBeNull();
  });

  it('is in the language on screen', () => {
    expect(help(6000, swiss, all, formatter('de'))).toBe(
      'Scooter, die nur ihren Akkustand melden, brauchen mindestens 9% (Voi), 21% (Bolt) und 53% (Lime). ' +
      'Scooter ohne Reichweiten- oder Akkuangabe werden ausgeblendet, solange eine Mindestreichweite gewählt ist.');
    expect(help(6000, swiss, all, formatter('fr'))).toBe(
      'Les trottinettes qui n’indiquent que leur batterie doivent en avoir au moins 9~% (Voi), 21~% (Bolt) et 53~% (Lime). ' +
      'Les trottinettes sans autonomie ni niveau de batterie indiqués sont masquées tant qu’un minimum est défini.');
    expect(help(12_000, swiss, all, formatter('de'))).toContain(
      'Scooter von Lime, die nur ihren Akkustand melden, werden ausgeblendet: Ein voller Akku reicht womöglich nicht 12 km weit.');
  });
});
