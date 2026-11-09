import { describe, expect, it } from 'vitest';
import { filterBattery, fleetReach, fullRangeByProvider, fullRangeOfType, passesMinBattery, viewFullRanges,
  withBatteryEstimates } from '@/lib/batteryEstimate';
import type { Vehicle } from '@/lib/types';

const scooter = (provider: string, battery: number | null, range_m: number | null, extra: Partial<Vehicle> = {}): Vehicle => ({
  provider, lat: 48.77, lng: 9.18, battery, range_m, vehicle_id: null, deep_link: null, distance_m: null, ...extra,
});
// `count` ranges from `from` to `to` metres, evenly.
const spread = (count: number, from: number, to: number) =>
  Array.from({ length: count }, (_, index) => Math.round(from + (to - from) * index / (count - 1)));

describe('the battery the filter judges', () => {
  it('is the scooter\'s own, or else the one estimated from its range', () => {
    expect(filterBattery(scooter('lime', 70, 9000, { battery_estimate: 20 }))).toBe(70);
    expect(filterBattery(scooter('lime', null, 9000, { battery_estimate: 70 }))).toBe(70);
    expect(filterBattery(scooter('lime', null, 9000))).toBeNull();
  });

  it('passes a minimum on either, and hides a scooter with neither', () => {
    expect(passesMinBattery(scooter('lime', null, 9000, { battery_estimate: 70 }), 60)).toBe(true);
    expect(passesMinBattery(scooter('lime', null, 9000, { battery_estimate: 50 }), 60)).toBe(false);
    expect(passesMinBattery(scooter('dott', null, null), 30)).toBe(false);
    expect(passesMinBattery(scooter('dott', null, null), 0)).toBe(true);
  });
});

describe('a full battery of scooters that report a range and no battery', () => {
  it('is the type\'s declared maximum where their longest come within 15% under it, as Voi\'s 80 km', () => {
    expect(fullRangeOfType(spread(40, 4000, 79_000), 80_000)).toBe(80_000);
    expect(fullRangeOfType(spread(40, 4000, 68_000), 80_000)).toBe(80_000);
  });

  it('is their 99th percentile where the maximum declared is out of reach, as Lime\'s 40 km in Stuttgart', () => {
    // Lime declares 40,233 m and its scooters in Stuttgart report up to 13.4 km, 11.5 at the 99th percentile.
    const stuttgart = [...spread(99, 1000, 11_500), 13_400];
    expect(fullRangeOfType(stuttgart, 40_233)).toBe(11_500);
    expect(fullRangeOfType(spread(40, 1000, 30_000))).toBe(30_000);
    // Beyond the maximum declared, the scooters' own longest.
    expect(fullRangeOfType(spread(40, 1000, 30_000), 24_140)).toBe(30_000);
  });

  it('is not worked out from under 20 scooters', () => {
    expect(fullRangeOfType(spread(19, 1000, 30_000), 30_000)).toBeNull();
    expect(fullRangeOfType(spread(20, 1000, 30_000), 30_000)).toBe(30_000);
    expect(fullRangeOfType(Array(30).fill(0))).toBeNull();
  });

  it('estimates the battery of each by its type, and of no other', () => {
    const lime = spread(30, 1000, 12_000).map(range => scooter('lime', null, range));
    const bikes = spread(25, 2000, 60_000).map(range => scooter('lime', null, range));
    const given = scooter('lime', 55, 6000);
    const none = scooter('lime', null, null);
    const types = new Map<Vehicle, string>([...lime.map(v => [v, 'scooter'] as const), ...bikes.map(v => [v, 'other'] as const)]);
    const estimated = withBatteryEstimates([...lime, ...bikes, given, none], vehicle => {
      const id = types.get(vehicle);
      return id ? { id, declared: 40_233 } : undefined;
    });
    expect(estimated[0].battery_estimate).toBe(8);
    expect(estimated[29].battery_estimate).toBe(100);
    // 6.7 km of the scooters' 12 km, the longest of theirs: the 40 km Lime declares is out of reach.
    expect(estimated[15]).toMatchObject({ range_m: 6690, battery_estimate: 56 });
    expect(estimated[30 + 24]).toMatchObject({ range_m: 60_000, battery_estimate: 100 });
    // The others' battery is their own, or there is none to estimate.
    expect(estimated.at(-2)).toBe(given);
    expect(estimated.at(-1)).toBe(none);
  });

  it('caps the estimate at 100% for the few beyond the 99th percentile', () => {
    const ranges = [...spread(99, 1000, 10_000), 15_000];
    const estimated = withBatteryEstimates(ranges.map(range => scooter('lime', null, range)), () => ({ id: 'scooter' }));
    expect(estimated.at(-1)?.battery_estimate).toBe(100);
    expect(estimated.at(-2)?.battery_estimate).toBe(100);
    expect(estimated[49].battery_estimate).toBe(Math.round(estimated[49].range_m! / 10_000 * 100));
  });

  it('leaves the scooters as they are where none can be estimated', () => {
    const few = spread(5, 1000, 9000).map(range => scooter('lime', null, range));
    expect(withBatteryEstimates(few, () => ({ id: 'scooter' }))).toEqual(few);
  });
});

describe('how far a full battery takes an app\'s scooters', () => {
  it('is the median of range over battery, of those at 40% or more', () => {
    // Bolt gives 70 km × the battery − 5 km: read from 40% up, its full battery reads 60-odd km.
    const bolt = Array.from({ length: 61 }, (_, index) => 40 + index).map(battery => scooter('bolt', battery, (70 * battery / 100 - 5) * 1000));
    const low = Array.from({ length: 30 }, (_, index) => scooter('bolt', 10 + index, 1000));
    const reach = fleetReach([...bolt, ...low]).get('bolt')!;
    expect(reach).toMatchObject({ scooters: 91, judged: 91, samples: 61 });
    expect(reach.fullRange! / 1000).toBeCloseTo(62.86, 1);
  });

  it('counts the estimated batteries as batteries, and those with none as unjudged', () => {
    const lime = spread(30, 5000, 12_000).map(range => scooter('lime', null, range, { battery_estimate: Math.round(range / 120) }));
    const dott = Array.from({ length: 10 }, () => scooter('dott', null, null));
    const reach = fleetReach([...lime, ...dott]);
    expect(reach.get('lime')).toMatchObject({ scooters: 30, judged: 30, samples: 30 });
    expect(reach.get('lime')!.fullRange! / 1000).toBeCloseTo(12, 0);
    expect(reach.get('dott')).toEqual({ scooters: 10, judged: 0, samples: 0, fullRange: null });
  });

  it('is not worked out from under 20 scooters', () => {
    const few = Array.from({ length: 19 }, () => scooter('voi', 50, 40_000));
    expect(fleetReach(few).get('voi')?.fullRange).toBeNull();
  });

  it('is worked out once for a list', () => {
    const list = Array.from({ length: 20 }, () => scooter('voi', 50, 40_000));
    expect(fleetReach(list)).toBe(fleetReach(list));
  });
});

describe('the full ranges of an answer', () => {
  const fleet = (provider: string, count: number, battery: number | null, range: number | null) =>
    Array.from({ length: count }, () => scooter(provider, battery, range));

  it('weighs the feeds in view by their samples, in whole hundreds of metres', () => {
    const ranges = viewFullRanges([fleet('voi', 30, 50, 40_000), fleet('voi', 10, 50, 40_000).concat(fleet('voi', 20, 50, 30_000))]);
    // 30 at 80 km, then a feed of 30 whose median is 60 km.
    expect(ranges).toEqual({ voi: 70_000 });
    expect(viewFullRanges([fleet('lime', 25, 100, 12_345)])).toEqual({ lime: 12_300 });
  });

  it('takes an app\'s from elsewhere where its feeds in view have no ranges', () => {
    // Lime's rider map gives batteries and no ranges in Berlin.
    const berlin = fleet('lime', 40, 70, null);
    expect(viewFullRanges([berlin], new Map([['lime', 38_000]]))).toEqual({ lime: 38_000 });
    expect(viewFullRanges([berlin])).toEqual({});
  });

  it('leaves out an app whose scooters in view mostly have no battery the filter judges', () => {
    const dott = fleet('dott', 30, null, null).concat(fleet('dott', 20, 80, 30_000));
    expect(viewFullRanges([dott], new Map([['dott', 35_000]]))).toEqual({});
    const half = fleet('dott', 25, null, null).concat(fleet('dott', 25, 80, 30_000));
    expect(viewFullRanges([half])).toEqual({ dott: 37_500 });
  });

  it('takes each app\'s over every feed as the median of the feeds\', weighed by their samples', () => {
    const everywhere = fullRangeByProvider([fleet('lime', 100, 100, 40_000), fleet('lime', 30, 100, 11_500), fleet('lime', 20, 100, 20_000),
      fleet('bolt', 5, 100, 60_000)]);
    expect(everywhere).toEqual(new Map([['lime', 40_000]]));
    expect(fullRangeByProvider([fleet('lime', 30, 100, 40_000), fleet('lime', 100, 100, 11_500)]).get('lime')).toBe(11_500);
  });
});
