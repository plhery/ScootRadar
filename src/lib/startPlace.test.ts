import { describe, expect, it } from 'vitest';
import { TIME_ZONES, TIME_ZONE_ALIASES, TZDATA_VERSION } from '@/generated/timeZones';
import type { CoveredCity } from '@/lib/coveredCities';
import { startCity, timeZoneCountry } from '@/lib/startPlace';

function city(id: string, country: CoveredCity['country'], center: [number, number]): CoveredCity {
  const [lat, lng] = center;
  return { id, city: id.split(':').at(-1)!, country, center, bounds: { south: lat - 0.1, west: lng - 0.1, north: lat + 0.1, east: lng + 0.1 } };
}

// North America as country agents may add it; the country codes are those of the catalog to come.
const CITIES = [
  city('ch:zurich', 'CH', [47.3769, 8.5417]),
  city('ch:st-gallen', 'CH', [47.4245, 9.3767]),
  city('fr:Nice', 'FR', [43.7031, 7.2661]),
  city('fr:Houilles', 'FR', [48.926, 2.188]),
  city('de:Berlin', 'DE', [52.52, 13.405]),
  city('ua:Kyiv', 'UA', [50.45, 30.5234]),
  city('ca:on:toronto', 'CA' as CoveredCity['country'], [43.6532, -79.3832]),
  city('ca:qc:montreal', 'CA' as CoveredCity['country'], [45.5019, -73.5674]),
  city('us:tx:austin', 'US' as CoveredCity['country'], [30.2672, -97.7431]),
  city('us:or:portland', 'US' as CoveredCity['country'], [45.5152, -122.6784]),
  city('mx:cdmx', 'MX' as CoveredCity['country'], [19.4326, -99.1332]),
];
const startId = (timeZone: string | undefined) => startCity(timeZone, CITIES)?.id ?? null;

describe('startCity', () => {
  it('opens on the covered city nearest the main place of the zone, in its country', () => {
    expect(startId('Europe/Zurich')).toBe('ch:zurich');
    expect(startId('Europe/Berlin')).toBe('de:Berlin');
    // Paris itself has no shared scooters: the nearest town that has them.
    expect(startId('Europe/Paris')).toBe('fr:Houilles');
    expect(startId('America/Toronto')).toBe('ca:on:toronto');
    expect(startId('America/Mexico_City')).toBe('mx:cdmx');
    // A zone of the country without a city of its own opens on the country's nearest.
    expect(startId('America/Chicago')).toBe('us:tx:austin');
    expect(startId('America/Los_Angeles')).toBe('us:or:portland');
    expect(startId('America/Halifax')).toBe('ca:qc:montreal');
  });

  it('knows the older names a device may report', () => {
    expect(startId('Europe/Kiev')).toBe('ua:Kyiv');
    expect(startId('America/Montreal')).toBe('ca:on:toronto');
    expect(startId('US/Central')).toBe('us:tx:austin');
    expect(startId('Mexico/General')).toBe('mx:cdmx');
  });

  it('crosses a border only to a city within 150 km, where the country has none', () => {
    expect(startId('Europe/Monaco')).toBe('fr:Nice');
    expect(startId('Europe/Vaduz')).toBe('ch:st-gallen');
    expect(startId('Europe/Vienna')).toBeNull();
  });

  it('keeps Switzerland for zones it does not know or that have nothing near', () => {
    expect(startId(undefined)).toBeNull();
    expect(startId('UTC')).toBeNull();
    expect(startId('Etc/GMT+5')).toBeNull();
    expect(startId('Asia/Tokyo')).toBeNull();
    expect(startId('constructor')).toBeNull();
    expect(startId('__proto__')).toBeNull();
    // North America before any of its cities is covered.
    expect(startCity('America/New_York', CITIES.filter(({ country }) => !['US', 'CA', 'MX'].includes(country)))).toBeNull();
  });
});

describe('timeZoneCountry', () => {
  it('is the country of a zone the table knows, by its name or an older one, and none for another', () => {
    expect(timeZoneCountry('America/Chicago')).toBe('US');
    expect(timeZoneCountry('America/Montreal')).toBe('CA');
    expect(timeZoneCountry('Europe/Zurich')).toBe('CH');
    expect(timeZoneCountry('UTC')).toBeNull();
    expect(timeZoneCountry('Asia/Tokyo')).toBeNull();
    expect(timeZoneCountry('__proto__')).toBeNull();
    expect(timeZoneCountry(undefined)).toBeNull();
  });
});

describe('the time zone table', () => {
  it('lists Europe and North America from a named IANA release, with each alias pointing at a zone it lists', () => {
    expect(TZDATA_VERSION).toMatch(/^\d{4}[a-z]$/);
    expect(TIME_ZONES['Europe/Oslo']).toEqual({ country: 'NO', point: [59.9167, 10.75] });
    expect(TIME_ZONES['America/Toronto'].country).toBe('CA');
    expect(TIME_ZONES['Pacific/Honolulu'].country).toBe('US');
    expect(TIME_ZONES['Asia/Tokyo']).toBeUndefined();
    expect(TIME_ZONES['Africa/Cairo']).toBeUndefined();
    for (const [alias, zone] of Object.entries(TIME_ZONE_ALIASES)) expect(TIME_ZONES[zone], alias).toBeDefined();
  });
});
