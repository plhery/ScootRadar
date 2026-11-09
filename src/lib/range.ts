import type { Vehicle } from '@/lib/types';

// The range minimum, the filters' only one (issue #12), judged the same by the cache, the website and the apps.

/**
 * How far a full battery takes, in metres, the scooters of an app missing from the answer's batteryRanges:
 * data/battery-full-ranges.json's defaultMeters, so 3 km needs 30%.
 */
export const DEFAULT_BATTERY_RANGE_M = 10_000;

/**
 * Whether a scooter can go `minRange` metres, 0 for any. One that says its range is judged by it; one
 * that says only its battery, pessimistically, by its battery times `full`, how far a full battery
 * takes its app's scooters at the least, in whole numbers (battery × full ≥ minRange × 100); one that
 * says neither is left out while a minimum is set: nothing says it would get there.
 */
export function reachesRange(vehicle: Pick<Vehicle, 'battery' | 'range_m'>, minRange: number, full: number): boolean {
  if (minRange === 0) return true;
  if (vehicle.range_m !== null) return vehicle.range_m >= minRange;
  return vehicle.battery !== null && vehicle.battery * full >= minRange * 100;
}

/**
 * The battery a scooter that says only its battery needs to go `minRange` metres: over 100 where
 * even a full one may not get there, which leaves out all of that app's.
 */
export function batteryNeeded(minRange: number, full: number): number {
  return Math.ceil(minRange * 100 / full);
}

/** How far it can go as the minimum judges it: its range, or else its battery times `full`; null for neither. */
export function effectiveRange(vehicle: Pick<Vehicle, 'battery' | 'range_m'>, full: number): number | null {
  if (vehicle.range_m !== null) return vehicle.range_m;
  return vehicle.battery === null ? null : vehicle.battery * full / 100;
}

/** It says its battery and not its range: what the answers' batteryRanges are given for. */
export const reportsBatteryOnly = (vehicle: Pick<Vehicle, 'battery' | 'range_m'>) =>
  vehicle.range_m === null && vehicle.battery !== null;

/**
 * The scooter API's minimums, 0 for none: the range's, and the battery's that the App Store iPhone app
 * and early Android builds still send, judged by the battery alone, as before the range minimum. Given
 * both, a scooter passes both. `full` gives each app's full battery range (data/battery-full-ranges.json).
 */
export function passesMinimums(vehicle: Pick<Vehicle, 'provider' | 'battery' | 'range_m'>,
  { minBattery, minRange = 0 }: { minBattery: number; minRange?: number }, full: (provider: string) => number): boolean {
  return (minBattery === 0 || (vehicle.battery !== null && vehicle.battery >= minBattery)) &&
    (minRange === 0 || reachesRange(vehicle, minRange, full(vehicle.provider)));
}
