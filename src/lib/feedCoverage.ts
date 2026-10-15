import { boundsIntersect } from '@/lib/geo';
import type { MapBounds } from '@/lib/types';
import { REGIONAL_SCOOTER_SYSTEMS, serviceAreas } from '@/lib/regionalScooterSystems';
import swissAreas from '../../data/swiss-scooter-areas.json';

// The Swiss registry is queried only within this padded national envelope.
export const SWISS_MOBILITY_BOUNDS: MapBounds = {
  south: 45.70,
  west: 5.70,
  north: 47.95,
  east: 10.75,
};

export const MOBILITY_COVERAGE = [
  SWISS_MOBILITY_BOUNDS,
  ...REGIONAL_SCOOTER_SYSTEMS.flatMap(system => serviceAreas(system).map(area => area.bounds)),
];

// Bound world-level queries while retaining all reviewed countries.
export const SUPPORTED_MOBILITY_BOUNDS: MapBounds = {
  south: Math.min(...MOBILITY_COVERAGE.map(bounds => bounds.south)),
  west: Math.min(...MOBILITY_COVERAGE.map(bounds => bounds.west)),
  north: Math.max(...MOBILITY_COVERAGE.map(bounds => bounds.north)),
  east: Math.max(...MOBILITY_COVERAGE.map(bounds => bounds.east)),
};

/**
 * Conservative operating-area envelopes used before downloading live vehicle
 * feeds. They intentionally extend beyond municipal borders so scooters near a
 * service-area edge are not missed.
 *
 * Unknown systems are not rejected from this table: scooterFeeds falls back to
 * sharedmobility.ch's spatial API for those systems.
 */
export const SWISS_SCOOTER_AREAS = swissAreas;
const AREA_BOUNDS: Record<string, MapBounds> = Object.fromEntries(
  swissAreas.map(area => [area.id.slice(3), area.bounds])
);

const SYSTEM_SUFFIXES = [
  'illnau-effretikon',
  'st-gallen',
  'schaffhausen',
  'winterthur',
  'romanshorn',
  'rorschach',
  'frauenfeld',
  'opfikon',
  'zurich',
  'basel',
  'kloten',
  'uster',
  'biel',
  'bern',
] as const;

/**
 * Systems sharedmobility.ch still lists for towns where their operator shows no scooter:
 * left out of collection, so of the map, the city totals and the cache's alerts. Lime's
 * Winterthur, Zug and Wetzikon systems have listed no vehicle, on time, since at least
 * 11 October 2026. Winterthur licenses Voi alone until the end of 2027 (Voi's scooters there
 * stay on the map); Zug stopped its rental e-scooters in November 2023, and Wetzikon at the end
 * of its pilot in February 2023, so neither is a town of the map any more. Bird Grenchen last
 * sent positions on 8 August 2026, and Bird's Bulle system has no vehicle feed: JM Fleets rents
 * its Bulle scooters in its own app now, which publishes none. With no other operator there,
 * Grenchen and Bulle left the map's towns on 15 October 2026. Check them again
 * (docs/coverage-gaps.md): Winterthur in 2028, the others in spring 2027.
 */
export const LEFT_OUT_SWISS_SYSTEMS: ReadonlySet<string> = new Set([
  'lime_winterthur', 'lime_zug', 'lime_wetzikon', 'bird-grenchen', 'bird-platform-partner-jmfleets-bulle',
]);

// Systems named after one town that serve others too, as their published
// geofencing shows: Bolt Zürich's "Wadenswil" zone, which takes in Richterswil,
// and Dott St. Gallen's polygons around Wil and Lichtensteig.
const SYSTEM_EXTRA_AREAS: Record<string, string[]> = {
  bolt_zurich: ['wadenswil'],
  'dott_st-gallen': ['wil', 'lichtensteig'],
};

const REGION_ALIASES: Record<string, string[]> = {
  'biel-bienne': ['biel'],
  'biel-bienne-bern': ['biel', 'bern'],
  'locarnese-bellinzonese': ['locarno'],
  // Voi's Nyon region is the Région de Nyon's bike network: on 15 October 2026 its 54
  // stations there held 209 to 215 e-bikes and no scooter, so it names no town of the map.
  nyon: [],
  ticino: ['locarno'],
};

export interface RegionCoverage {
  bounds: MapBounds[];
  complete: boolean;
}

function areaName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function areasForName(value: string): string[] {
  const normalized = areaName(value);
  return REGION_ALIASES[normalized] ?? [normalized];
}

export function knownSystemCoverage(systemId: string): MapBounds[] | null {
  const id = systemId.toLowerCase();

  // These systems span several regions or do not identify a city in their ID.
  // Their coverage is resolved from system_regions or the spatial API instead.
  if (id === 'voiscooters.com' || id === 'publibike') {
    return null;
  }

  const suffix = SYSTEM_SUFFIXES.find(area => (
    id.endsWith(`_${area}`) || id.endsWith(`-${area}`)
  ));
  return suffix ? [suffix, ...(SYSTEM_EXTRA_AREAS[id] ?? [])].map(area => AREA_BOUNDS[area]) : null;
}

export function coverageForRegionNames(names: string[]): RegionCoverage {
  const resolved: MapBounds[] = [];
  let complete = names.length > 0;

  for (const name of names) {
    const areas = areasForName(name);
    const matches = areas.map(area => AREA_BOUNDS[area]).filter(Boolean);
    if (matches.length !== areas.length) complete = false;
    resolved.push(...matches);
  }

  return { bounds: resolved, complete };
}

export function coverageIntersects(bounds: MapBounds[], query: MapBounds): boolean {
  return bounds.some(coverage => boundsIntersect(coverage, query));
}

// Hopp publishes each Swiss town at api.hopp.bike/gbfs/ch-<town>; sharedmobility.ch has none of them.
export const HOPP_SWISS_TOWNS = ['zurich', 'basel', 'kloten'].map(town => ({
  id: `hopp_ch_${town}`,
  discoveryUrl: `https://api.hopp.bike/gbfs/ch-${town}/gbfs.json`,
  coverage: AREA_BOUNDS[town],
}));
export const PUBLIBIKE_FREE_FLOATING_COVERAGE = AREA_BOUNDS.zurich;
// PubliBike's station-based e-scooters are confined to Biel and Locarno, though
// its bicycle network is national.
export const PUBLIBIKE_STATION_COVERAGE = [AREA_BOUNDS.biel, AREA_BOUNDS.locarno];
