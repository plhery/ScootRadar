import {
  COUNTRY_ANCHORS, COUNTRY_REGIONS, type CountryCode, type CountryNameLanguage, type CountryRegion,
} from '@/generated/countries';
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
// or for a whole country, state or province.
export interface CityGroup extends ScooterCluster {
  bounds?: MapBounds;
}

// Further out than this, where a phone shows more than France, a country is one total.
export const COUNTRY_TOTALS_BELOW_ZOOM = 5;
// Down to this zoom, a country whose totals are its states' or provinces' (data/countries.json)
// shows one per region; further out, where the whole United States is a couple of hundred
// pixels wide, one for the country again.
export const REGION_TOTALS_FROM_ZOOM = 3;
// Centres closer than this would draw the totals over one another.
const CITY_GROUP_SPACING_PX = 60;
// Named in a group's label; the rest are left to zooming in.
const CITY_GROUP_NAMES = 3;
// Where a country's total stands, inland and about the middle of the country, is in data/countries.json.

// "city:fr:Paris" is in France, and "city:us:or:Portland" in the United States.
function countryOf(city: ScooterCluster): string | null {
  return /^city:([a-z]{2}):/.exec(city.id)?.[1] ?? null;
}

// "city:us:or:Portland" is in Oregon, where the United States' totals are its states'.
function regionOf(city: ScooterCluster, country: string): CountryRegion | null {
  const regions = COUNTRY_REGIONS[country.toUpperCase() as CountryCode];
  if (!regions?.totals) return null;
  const code = /^city:[a-z]{2}:([a-z]{2,3}):/.exec(city.id)?.[1].toUpperCase();
  return regions.list.find(region => region.code === code && region.anchor) ?? null;
}

/** A region's name in the language: "British Columbia", "Colombie-Britannique". */
export function regionName(region: CountryRegion, language: CountryNameLanguage): string {
  return region.names?.[language] ?? region.name;
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

function countryTotals(cities: ScooterCluster[], countryName: (code: string) => string,
  byRegion: boolean, language: CountryNameLanguage): CityGroup[] {
  const groups = new Map<string, { name: string; anchor?: readonly [number, number]; members: ScooterCluster[] }>();
  const totals: CityGroup[] = [];
  for (const city of cities) {
    const country = countryOf(city);
    if (!country) {
      totals.push(city);
      continue;
    }
    const region = byRegion ? regionOf(city, country) : null;
    const id = region ? `region:${country}:${region.code.toLowerCase()}` : `country:${country}`;
    const group = groups.get(id) ?? { members: [],
      ...(region ? { name: regionName(region, language), anchor: region.anchor }
        : { name: countryName(country), anchor: COUNTRY_ANCHORS[country.toUpperCase() as CountryCode] }) };
    group.members.push(city);
    groups.set(id, group);
  }
  for (const [id, { name, anchor, members }] of groups) {
    const [lat, lng] = anchor ?? [members[0].lat, members[0].lng];
    totals.push({
      id, city: name, lat, lng,
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

// Zoomed out to a continent, one total per country, never two countries in one, or per state
// or province where the country's totals are its regions', the larger drawn over its
// neighbours; closer, one per city or cluster of neighbouring cities. Countries are named by
// countryName, regions in the language.
export function groupCityTotals(
  cities: ScooterCluster[],
  zoom: number,
  countryName: (code: string) => string = code => code.toUpperCase(),
  language: CountryNameLanguage = 'en',
): CityGroup[] {
  return zoom < COUNTRY_TOTALS_BELOW_ZOOM
    ? countryTotals(cities, countryName, zoom >= REGION_TOTALS_FROM_ZOOM, language).sort(byCount)
    : spaceApart(cities, zoom);
}
