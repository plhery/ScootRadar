import type { Vehicle } from '@/lib/types';

/**
 * Some feeds give a scooter's range and no battery (Lime's, Voi's and Ryde's GBFS among others),
 * and the battery filter would hide them all. Their battery is estimated from the range, and each
 * app's usual range on a full battery is worked out where both are known, for the filters to say
 * how far the minimum chosen usually takes a scooter (census of 9 November 2026, issue #12).
 */

/** The fewest scooters of a type, or of an app in a feed, that a full battery is worked out from. */
export const FULL_RANGE_MIN_SCOOTERS = 20;
/** The batteries a full one's range is worked out from: lower, Bolt's 70 km × battery − 5 km reads short. */
const FULL_RANGE_MIN_BATTERY = 40;
/** A type's declared maximum stands for a full battery where its scooters' longest reach this much of it. */
const DECLARED_AGREES = 0.85;

/** The battery the filter judges a scooter by: its own, or the one estimated from its range. */
export function filterBattery(vehicle: Pick<Vehicle, 'battery' | 'battery_estimate'>): number | null {
  return vehicle.battery ?? vehicle.battery_estimate ?? null;
}

export function passesMinBattery(vehicle: Pick<Vehicle, 'battery' | 'battery_estimate'>, minBattery: number): boolean {
  if (minBattery <= 0) return true;
  const battery = filterBattery(vehicle);
  return battery !== null && battery >= minBattery;
}

/** The value `share` of the way up sorted `values`, by nearest rank. */
function rank(sorted: readonly number[], share: number): number {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(share * sorted.length) - 1))];
}

/**
 * The range a full battery gives scooters of one type that report a range and no battery: the 99th
 * percentile of their ranges, or the type's declared maximum where that percentile is within 15% under
 * it, as Voi's 80 km (its ranges are 80 km × the battery exactly). Lime declares 24 or 40 km and reports
 * up to 13 km in Stuttgart, 40 in Chicago: its scooters' own longest stand for a full battery. Null under
 * 20 scooters, too few to say what a full one reports.
 */
export function fullRangeOfType(ranges: readonly number[], declared?: number): number | null {
  if (ranges.length < FULL_RANGE_MIN_SCOOTERS) return null;
  const longest = rank([...ranges].sort((a, b) => a - b), 0.99);
  if (declared && declared > 0 && longest <= declared && longest >= declared * DECLARED_AGREES) return declared;
  return longest > 0 ? longest : null;
}

/**
 * `vehicles`, those with a range and no battery given a battery_estimate: the range over their type's
 * full one (fullRangeOfType), at most 100%. `typeOf` says each one's type and what it declares.
 */
export function withBatteryEstimates<T extends Vehicle>(vehicles: T[],
  typeOf: (vehicle: T) => { id: string; declared?: number } | undefined): T[] {
  const groups = new Map<string, { declared?: number; ranges: number[] }>();
  const types = vehicles.map(vehicle => {
    if (vehicle.battery !== null || vehicle.range_m === null) return undefined;
    const type = typeOf(vehicle);
    if (!type) return undefined;
    const group = groups.get(type.id) ?? groups.set(type.id, { declared: type.declared, ranges: [] }).get(type.id)!;
    group.ranges.push(vehicle.range_m);
    return type.id;
  });
  if (!groups.size) return vehicles;
  const full = new Map([...groups].map(([id, group]) => [id, fullRangeOfType(group.ranges, group.declared)]));
  return vehicles.map((vehicle, index) => {
    const range = full.get(types[index] ?? '');
    return range && vehicle.range_m !== null
      ? { ...vehicle, battery_estimate: Math.min(100, Math.round(vehicle.range_m / range * 100)) }
      : vehicle;
  });
}

/** One app's scooters in a feed: how many, how many have a battery the filter judges, and a full one's range. */
export interface FleetReach {
  scooters: number;
  judged: number;
  /** The median of range over battery at 40% or more, from `samples` scooters; null under 20. */
  fullRange: number | null;
  samples: number;
}

const REACH = new WeakMap<readonly Vehicle[], ReadonlyMap<string, FleetReach>>();

/** Each app's FleetReach among `vehicles`, worked out once for each list (a feed's collection). */
export function fleetReach(vehicles: readonly Vehicle[]): ReadonlyMap<string, FleetReach> {
  const known = REACH.get(vehicles);
  if (known) return known;
  const fleets = new Map<string, { scooters: number; judged: number; ratios: number[] }>();
  for (const vehicle of vehicles) {
    const fleet = fleets.get(vehicle.provider) ?? fleets.set(vehicle.provider, { scooters: 0, judged: 0, ratios: [] }).get(vehicle.provider)!;
    fleet.scooters++;
    const battery = filterBattery(vehicle);
    if (battery === null) continue;
    fleet.judged++;
    if (battery >= FULL_RANGE_MIN_BATTERY && vehicle.range_m !== null) fleet.ratios.push(vehicle.range_m * 100 / battery);
  }
  const reach = new Map([...fleets].map(([provider, { scooters, judged, ratios }]) => [provider, {
    scooters, judged, samples: ratios.length,
    fullRange: ratios.length >= FULL_RANGE_MIN_SCOOTERS ? rank(ratios.sort((a, b) => a - b), 0.5) : null,
  }]));
  REACH.set(vehicles, reach);
  return reach;
}

/** Each app's full range over all `fleets`: the median of the feeds' own, weighed by their samples. */
export function fullRangeByProvider(fleets: Iterable<readonly Vehicle[]>): Map<string, number> {
  const ranges = new Map<string, { fullRange: number; samples: number }[]>();
  for (const vehicles of fleets) {
    for (const [provider, reach] of fleetReach(vehicles)) {
      if (reach.fullRange === null) continue;
      (ranges.get(provider) ?? ranges.set(provider, []).get(provider)!).push({ fullRange: reach.fullRange, samples: reach.samples });
    }
  }
  return new Map([...ranges].map(([provider, feeds]) => {
    feeds.sort((a, b) => a.fullRange - b.fullRange);
    const half = feeds.reduce((sum, feed) => sum + feed.samples, 0) / 2;
    let seen = 0;
    const median = feeds.find(feed => (seen += feed.samples) >= half)!;
    return [provider, median.fullRange];
  }));
}

/**
 * The response's fullRanges: each app among `fleets` (the feeds covering the view) whose scooters there
 * mostly have a battery the filter judges, with the usual range of a full one, in whole hundreds of
 * metres. From those feeds, weighed by their samples; where none has 20, from `elsewhere` (every feed,
 * fullRangeByProvider): Lime's rider map gives batteries and no ranges in Berlin, its GBFS ranges
 * elsewhere. An app with neither is left out, as is one whose scooters mostly have no battery (Dott's
 * rider map gives none): the filter hides them, and the line says nothing of them.
 */
export function viewFullRanges(fleets: Iterable<readonly Vehicle[]>,
  elsewhere: ReadonlyMap<string, number> = new Map()): Record<string, number> {
  const apps = new Map<string, { scooters: number; judged: number; weighed: number; samples: number }>();
  for (const vehicles of fleets) {
    for (const [provider, reach] of fleetReach(vehicles)) {
      const app = apps.get(provider) ?? apps.set(provider, { scooters: 0, judged: 0, weighed: 0, samples: 0 }).get(provider)!;
      app.scooters += reach.scooters;
      app.judged += reach.judged;
      if (reach.fullRange === null) continue;
      app.weighed += reach.fullRange * reach.samples;
      app.samples += reach.samples;
    }
  }
  const ranges: Record<string, number> = {};
  for (const [provider, app] of apps) {
    if (app.judged * 2 < app.scooters) continue;
    const meters = app.samples ? app.weighed / app.samples : elsewhere.get(provider);
    if (meters) ranges[provider] = Math.max(100, Math.round(meters / 100) * 100);
  }
  return ranges;
}
