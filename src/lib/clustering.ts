import type { MapBounds, ScooterCluster, Vehicle } from '@/lib/types';

export const MAX_CLUSTER_ZOOM = 15;
const TILE_SIZE = 256;
const MAX_MERCATOR_LATITUDE = 85.05112878;

export function shouldClusterAtZoom(zoom: number): boolean {
  return Number.isFinite(zoom) && zoom <= MAX_CLUSTER_ZOOM;
}

export interface ClusteredVehicles {
  vehicles: Vehicle[];
  clusters: ScooterCluster[];
}

// Fixed cells keep IDs stable when a padded viewport changes its vehicle count.
function clusterCellSize(zoom: number): number {
  return zoom >= 15 ? 56 : zoom >= 13 ? 64 : 80;
}

function worldPixel(vehicle: { lat: number; lng: number }, zoom: number): [number, number] {
  const worldSize = TILE_SIZE * 2 ** zoom;
  const latitude = Math.max(
    -MAX_MERCATOR_LATITUDE,
    Math.min(MAX_MERCATOR_LATITUDE, vehicle.lat)
  );
  const sinLatitude = Math.sin(latitude * Math.PI / 180);
  return [
    (vehicle.lng + 180) / 360 * worldSize,
    (0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) * worldSize,
  ];
}

export function clusterVehicles(vehicles: Vehicle[], zoom: number): ClusteredVehicles {
  if (!shouldClusterAtZoom(zoom)) return { vehicles, clusters: [] };

  const cellSize = clusterCellSize(zoom);
  const cells = new Map<string, Vehicle[]>();
  for (const vehicle of vehicles) {
    const [x, y] = worldPixel(vehicle, zoom);
    const cellX = Math.floor(x / cellSize);
    const cellY = Math.floor(y / cellSize);
    const key = `${zoom}:${cellX}:${cellY}`;
    const cell = cells.get(key);
    if (cell) cell.push(vehicle);
    else cells.set(key, [vehicle]);
  }

  const singletons: Vehicle[] = [];
  const clusters: ScooterCluster[] = [];
  for (const [id, cell] of cells) {
    if (cell.length === 1) {
      singletons.push(cell[0]);
      continue;
    }

    const providers: Record<string, number> = {};
    let latitude = 0;
    let longitude = 0;
    for (const vehicle of cell) {
      latitude += vehicle.lat;
      longitude += vehicle.lng;
      providers[vehicle.provider] = (providers[vehicle.provider] ?? 0) + 1;
    }
    clusters.push({
      id,
      lat: latitude / cell.length,
      lng: longitude / cell.length,
      count: cell.length,
      providers,
    });
  }

  clusters.sort((a, b) => a.id.localeCompare(b.id));
  return { vehicles: singletons, clusters };
}

// A city total that stands for several cities lying too close together to be told apart,
// or for a whole country.
export interface CityGroup extends ScooterCluster {
  bounds?: MapBounds;
}

// Further out than this, where a phone shows more than France, a country is one total.
export const COUNTRY_TOTALS_BELOW_ZOOM = 5;
// Centres closer than this would draw the totals over one another.
const CITY_GROUP_SPACING_PX = 60;
// Named in a group's label; the rest are left to zooming in.
const CITY_GROUP_NAMES = 3;
// Where a country's total stands: inland and about the middle of the country.
const COUNTRY_ANCHORS: Record<string, [number, number]> = {
  be: [50.6, 4.6], ch: [46.8, 8.2], de: [51.1, 10.4], es: [40.4, -2.5], fr: [46.6, 2.4],
  gb: [52.8, -1.6], is: [64.9, -18.6], it: [43, 12.5], nl: [52.2, 5.6], no: [61, 9.5], pt: [39.6, -8],
  // Inland, between Uppsala and Kiruna, and clear of Norway's total.
  se: [63.6, 17.8],
  // Inland, east of Rīga, about the middle of the country.
  lv: [56.9, 24.6],
  // About the middle of the country, near Łódź.
  pl: [52.1, 19.4],
  // About the middle of the country, south-east of Budapest.
  hu: [47.2, 19.5],
  // Inland, about the middle of the mainland, west of Lamia.
  gr: [39, 22],
  // Inland, in the Troodos mountains, between Paphos and Limassol.
  cy: [34.9, 32.9],
  // Inland in the south-west, between Turku and Tampere: on the mainland, so it isn't read
  // as Stockholm's, and on the side nearest Mariehamn, on Åland, where all its scooters are.
  fi: [61.1, 23.8],
};

// "city:fr:Paris" is in France.
function countryOf(city: ScooterCluster): string | null {
  return /^city:([a-z]{2}):/.exec(city.id)?.[1] ?? null;
}

function boundsOf(totals: CityGroup[]): MapBounds {
  return {
    south: Math.min(...totals.map(total => total.bounds?.south ?? total.lat)),
    west: Math.min(...totals.map(total => total.bounds?.west ?? total.lng)),
    north: Math.max(...totals.map(total => total.bounds?.north ?? total.lat)),
    east: Math.max(...totals.map(total => total.bounds?.east ?? total.lng)),
  };
}

function sumProviders(totals: ScooterCluster[]): Record<string, number> {
  const providers: Record<string, number> = {};
  for (const total of totals) {
    for (const [provider, count] of Object.entries(total.providers)) providers[provider] = (providers[provider] ?? 0) + count;
  }
  return providers;
}

function byCount(a: ScooterCluster, b: ScooterCluster): number {
  return b.count - a.count || a.id.localeCompare(b.id);
}

function countryTotals(cities: ScooterCluster[], countryName: (code: string) => string): CityGroup[] {
  const countries = new Map<string, ScooterCluster[]>();
  const totals: CityGroup[] = [];
  for (const city of cities) {
    const country = countryOf(city);
    if (!country) totals.push(city);
    else countries.set(country, [...countries.get(country) ?? [], city]);
  }
  for (const [country, members] of countries) {
    const [lat, lng] = COUNTRY_ANCHORS[country] ?? [members[0].lat, members[0].lng];
    totals.push({
      id: `country:${country}`, city: countryName(country), lat, lng,
      count: members.reduce((total, member) => total + member.count, 0),
      providers: sumProviders(members),
      bounds: boundsOf(members),
    });
  }
  return totals;
}

// The total with the most scooters takes in its neighbours on screen and stays where it is,
// so a group sits on a real city and keeps its place while the map is panned.
function spaceApart(totals: CityGroup[], zoom: number): CityGroup[] {
  const ordered = [...totals].sort(byCount).map(total => ({ total, point: worldPixel(total, zoom) }));
  const taken = new Set<string>();
  const groups: CityGroup[] = [];
  for (const head of ordered) {
    if (taken.has(head.total.id)) continue;
    const members = ordered.filter(other => !taken.has(other.total.id) &&
      Math.hypot(other.point[0] - head.point[0], other.point[1] - head.point[1]) < CITY_GROUP_SPACING_PX)
      .map(member => member.total);
    for (const member of members) taken.add(member.id);
    if (members.length === 1) {
      groups.push(head.total);
      continue;
    }

    const names = members.map(member => member.city).filter((name): name is string => Boolean(name));
    groups.push({
      ...head.total,
      id: `group:${head.total.id}`,
      city: names.length > CITY_GROUP_NAMES ? `${names.slice(0, CITY_GROUP_NAMES).join(', ')}…` : names.join(', '),
      count: members.reduce((total, member) => total + member.count, 0),
      providers: sumProviders(members),
      bounds: boundsOf(members),
    });
  }
  return groups;
}

// Zoomed out to a continent, one total per country, never two countries in one,
// the larger drawn over its neighbours; closer, one per city or cluster of neighbouring cities.
export function groupCityTotals(
  cities: ScooterCluster[],
  zoom: number,
  countryName: (code: string) => string = code => code.toUpperCase(),
): CityGroup[] {
  return zoom < COUNTRY_TOTALS_BELOW_ZOOM ? countryTotals(cities, countryName).sort(byCount) : spaceApart(cities, zoom);
}
