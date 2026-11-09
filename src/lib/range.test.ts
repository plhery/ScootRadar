import { describe, expect, it } from 'vitest';
import { batteryNeeded, DEFAULT_BATTERY_RANGE_M, effectiveRange, passesMinimums, reachesRange, reportsBatteryOnly } from '@/lib/range';
import { addBatteryRanges, batteryFullRange } from '@/lib/batteryFullRanges';
import table from '../../data/battery-full-ranges.json';

const scooter = (battery: number | null, range_m: number | null, provider = 'lime') => ({ provider, battery, range_m });

describe('reachesRange', () => {
  it('lets every scooter through without a minimum, those that say nothing too', () => {
    expect(reachesRange(scooter(null, null), 0, 11_500)).toBe(true);
    expect(reachesRange(scooter(0, 0), 0, 11_500)).toBe(true);
  });

  it('judges a scooter that says its range by it alone: 6000 m reach 6 km, 5999 do not', () => {
    expect(reachesRange(scooter(null, 6000), 6000, 11_500)).toBe(true);
    expect(reachesRange(scooter(null, 5999), 6000, 11_500)).toBe(false);
    // Its battery does not help a range that falls short, nor hurt one that does not.
    expect(reachesRange(scooter(100, 5999), 6000, 72_800)).toBe(false);
    expect(reachesRange(scooter(1, 6000), 6000, 10_000)).toBe(true);
  });

  it('judges one that says only its battery by its battery times a full one, in whole numbers', () => {
    // A Lime at 53% goes 6,095 m on 11.5 km a full battery: 53 × 11500 = 609500 ≥ 600000. At 52%, 598,000.
    expect(reachesRange(scooter(53, null), 6000, 11_500)).toBe(true);
    expect(reachesRange(scooter(52, null), 6000, 11_500)).toBe(false);
    // Exactly enough is enough: 30% of 10 km is 3 km.
    expect(reachesRange(scooter(30, null), 3000, DEFAULT_BATTERY_RANGE_M)).toBe(true);
    expect(reachesRange(scooter(29, null), 3000, DEFAULT_BATTERY_RANGE_M)).toBe(false);
    // Where even a full battery may not get there, none passes.
    expect(reachesRange(scooter(100, null), 12_000, 11_500)).toBe(false);
  });

  it('leaves out a scooter that says neither while a minimum is set, at 1 km too', () => {
    expect(reachesRange(scooter(null, null), 1000, 72_800)).toBe(false);
  });
});

describe('batteryNeeded', () => {
  it('rounds up the battery an app’s battery-only scooters need, as the filters say it', () => {
    // 6 km: Voi 8.2 → 9, Bolt 20.4 → 21, Lime 52.2 → 53.
    expect([72_800, 29_400, 11_500].map(full => batteryNeeded(6000, full))).toEqual([9, 21, 53]);
    // 12 km: Lime's would need 105%, so none of its battery-only scooters passes.
    expect([72_800, 29_400, 11_500].map(full => batteryNeeded(12_000, full))).toEqual([17, 41, 105]);
    // 3 mi, 4,828 m.
    expect([72_800, 29_400, 11_500].map(full => batteryNeeded(4828, full))).toEqual([7, 17, 42]);
    expect(batteryNeeded(3000, DEFAULT_BATTERY_RANGE_M)).toBe(30);
    expect(batteryNeeded(3000, 72_800)).toBe(5);
  });

  it('agrees with the rule at every battery: the battery needed is the first that passes', () => {
    for (const full of [10_000, 11_500, 29_400, 72_800]) {
      for (const minRange of [1000, 4828, 6000, 12_875, 30_000]) {
        const needed = batteryNeeded(minRange, full);
        for (let battery = 0; battery <= 100; battery++) {
          expect(reachesRange(scooter(battery, null), minRange, full), `${battery}% of ${full} for ${minRange}`).toBe(battery >= needed);
        }
      }
    }
  });
});

describe('effectiveRange', () => {
  it('is the range, or else the battery times a full one, or nothing', () => {
    expect(effectiveRange(scooter(10, 4000), 72_800)).toBe(4000);
    expect(effectiveRange(scooter(53, null), 11_500)).toBe(6095);
    expect(effectiveRange(scooter(null, null), 11_500)).toBeNull();
    expect(reportsBatteryOnly(scooter(53, null))).toBe(true);
    expect(reportsBatteryOnly(scooter(53, 6000))).toBe(false);
    expect(reportsBatteryOnly(scooter(null, null))).toBe(false);
  });
});

describe('passesMinimums', () => {
  const full = (provider: string) => (provider === 'lime' ? 11_500 : DEFAULT_BATTERY_RANGE_M);

  it('lets every scooter through without a minimum, those that say nothing too', () => {
    expect(passesMinimums(scooter(null, null), { minBattery: 0, minRange: 0 }, full)).toBe(true);
    expect(passesMinimums(scooter(null, null), { minBattery: 0 }, full)).toBe(true);
  });

  it('judges the range minimum by the range, or else by the battery and the app’s full range', () => {
    expect(passesMinimums(scooter(null, 5000), { minBattery: 0, minRange: 5000 }, full)).toBe(true);
    expect(passesMinimums(scooter(90, 4999), { minBattery: 0, minRange: 5000 }, full)).toBe(false);
    expect(passesMinimums(scooter(53, null), { minBattery: 0, minRange: 6000 }, full)).toBe(true);
    expect(passesMinimums(scooter(53, null, 'jet'), { minBattery: 0, minRange: 6000 }, full)).toBe(false);
    expect(passesMinimums(scooter(60, null, 'jet'), { minBattery: 0, minRange: 6000 }, full)).toBe(true);
  });

  it('judges the older apps’ battery minimum by the battery alone, as before the range minimum', () => {
    expect(passesMinimums(scooter(60, null), { minBattery: 60, minRange: 0 }, full)).toBe(true);
    expect(passesMinimums(scooter(59, 30_000), { minBattery: 60, minRange: 0 }, full)).toBe(false);
    expect(passesMinimums(scooter(null, 30_000), { minBattery: 60, minRange: 0 }, full)).toBe(false);
  });

  it('asks for both when both are set, as only the API may be asked', () => {
    expect(passesMinimums(scooter(60, 5000), { minBattery: 60, minRange: 5000 }, full)).toBe(true);
    expect(passesMinimums(scooter(60, 4000), { minBattery: 60, minRange: 5000 }, full)).toBe(false);
  });
});

describe('the cache’s full battery ranges', () => {
  it('reads data/battery-full-ranges.json, with its default for an app missing from it', () => {
    expect(batteryFullRange('lime')).toBe(11_500);
    expect(batteryFullRange('bolt')).toBe(29_400);
    expect(batteryFullRange('voi')).toBe(72_800);
    expect(batteryFullRange('jet')).toBe(table.defaultMeters);
    expect(batteryFullRange('constructor')).toBe(table.defaultMeters);
    expect(table.defaultMeters).toBe(DEFAULT_BATTERY_RANGE_M);
    for (const meters of Object.values(table.providers)) expect(Number.isInteger(meters) && meters > 0).toBe(true);
  });

  it('gives the figure of each app with a scooter in view that says its battery and not its range', () => {
    const at = (provider: string, battery: number | null, range_m: number | null, lat = 48.78) => ({
      ...scooter(battery, range_m, provider), vehicle_id: null, lat, lng: 9.18, distance_m: null, deep_link: null,
    });
    const view = { south: 48.7, west: 9.1, north: 48.8, east: 9.2 };
    expect(addBatteryRanges({}, [
      at('lime', 60, null), at('voi', null, 30_000), at('bolt', 40, 12_000), at('dott', null, null),
      at('jet', 80, null), at('beam', 80, null, 49.5),
    ], view)).toEqual({ lime: 11_500, jet: 10_000 });
    expect(addBatteryRanges({}, [at('voi', null, 30_000)], view)).toEqual({});
  });
});
