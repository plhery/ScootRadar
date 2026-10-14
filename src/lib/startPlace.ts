import { TIME_ZONES, TIME_ZONE_ALIASES } from '@/generated/timeZones';
import { COVERED_CITIES, type CoveredCity } from '@/lib/coveredCities';
import { haversineM } from '@/lib/geo';

// Where the map opens when it may not use the device's location: the covered
// city nearest the main place of the device's time zone, at the zoom a city
// chip flies to. The zone says roughly where the visitor is without asking
// anyone, and no address leaves the device. iOS does the same in
// ScooterStartPlace.swift; scripts/generate-time-zones.mjs makes the table.

/** How far across a border a zone may open when its own country has no city: Europe/Monaco on Nice. */
const NEIGHBOUR_REACH_M = 150_000;

function zoneOf(timeZone: string) {
  const name = Object.hasOwn(TIME_ZONES, timeZone)
    ? timeZone
    : Object.hasOwn(TIME_ZONE_ALIASES, timeZone) ? TIME_ZONE_ALIASES[timeZone] : null;
  return name === null ? null : TIME_ZONES[name];
}

/**
 * The city the map opens on for a device in this time zone: the covered city
 * nearest the zone's main place in the zone's country (Europe/Paris opens on
 * Paris, America/Chicago on the US city nearest Chicago), or within 150 km of
 * it when the country has none. null, and Switzerland as before, for a zone the
 * table does not know, such as UTC, and where no city is near.
 */
export function startCity(timeZone: string | undefined, cities: readonly CoveredCity[] = COVERED_CITIES): CoveredCity | null {
  const zone = timeZone ? zoneOf(timeZone) : null;
  if (!zone) return null;
  const [lat, lng] = zone.point;
  let home: { city: CoveredCity; distanceM: number } | null = null;
  let neighbour: { city: CoveredCity; distanceM: number } | null = null;
  for (const city of cities) {
    const distanceM = haversineM(lat, lng, city.center[0], city.center[1]);
    if (city.country === zone.country && (!home || distanceM < home.distanceM)) home = { city, distanceM };
    if (!neighbour || distanceM < neighbour.distanceM) neighbour = { city, distanceM };
  }
  if (home) return home.city;
  return neighbour && neighbour.distanceM <= NEIGHBOUR_REACH_M ? neighbour.city : null;
}

/**
 * The country of a time zone, "US" for America/Chicago, which the address
 * search sends instead of a map centre so that its places come first; null for
 * a zone the table does not know, such as UTC.
 */
export function timeZoneCountry(timeZone: string | undefined): string | null {
  return (timeZone ? zoneOf(timeZone)?.country : null) ?? null;
}

/** The IANA time zone of the device, such as "Europe/Zurich"; undefined where the browser gives none. */
export function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}
