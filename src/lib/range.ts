import type { Vehicle } from '@/lib/types';

/**
 * Whether a scooter reaches the battery and range minimums, each 0 for none. One that does not say
 * its battery, or its range, is left out while that minimum is set: nothing says it would get there.
 * The map sets one or the other, never both, as some apps give a battery and no range (Bolt, Lime and
 * Voi in Berlin) and others a range and no battery (Lime and Voi in Stuttgart).
 */
export function passesMinimums(vehicle: Pick<Vehicle, 'battery' | 'range_m'>,
  { minBattery, minRange = 0 }: { minBattery: number; minRange?: number }): boolean {
  return (minBattery === 0 || (vehicle.battery !== null && vehicle.battery >= minBattery)) &&
    (minRange === 0 || (vehicle.range_m !== null && vehicle.range_m >= minRange));
}
