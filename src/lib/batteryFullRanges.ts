import table from '../../data/battery-full-ranges.json';
import { reportsBatteryOnly } from '@/lib/range';
import type { MapBounds, Vehicle } from '@/lib/types';
import { boundsContainPoint } from '@/lib/geo';

// How far a full battery takes each app's scooters at the least, which the range minimum judges a scooter
// that says only its battery by (range.ts), and which each answer gives the clients as batteryRanges.

const PROVIDERS: Readonly<Record<string, number>> = table.providers;

/** In metres: the app's figure in data/battery-full-ranges.json, or its defaultMeters. */
export function batteryFullRange(provider: string): number {
  return Object.hasOwn(PROVIDERS, provider) ? PROVIDERS[provider] : table.defaultMeters;
}

/**
 * Adds to `into` the figure of each app with a scooter among `vehicles`, inside `bounds` when given, that
 * says its battery and not its range: the answer's batteryRanges, for the clients to judge such scooters
 * as the cache does and the filters to say what battery each app's need.
 */
export function addBatteryRanges(into: Record<string, number>, vehicles: Iterable<Vehicle>, bounds?: MapBounds): Record<string, number> {
  for (const vehicle of vehicles) {
    if (Object.hasOwn(into, vehicle.provider) || !reportsBatteryOnly(vehicle)) continue;
    if (bounds && !boundsContainPoint(bounds, vehicle.lat, vehicle.lng)) continue;
    into[vehicle.provider] = batteryFullRange(vehicle.provider);
  }
  return into;
}
