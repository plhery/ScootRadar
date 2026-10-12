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

// A city total that stands for several cities lying too close together to be told apart.
export interface CityGroup extends ScooterCluster {
  bounds?: MapBounds;
}

// Centres closer than this would draw the totals over one another.
const CITY_GROUP_SPACING_PX = 60;
// Named in a group's label; the rest are left to zooming in.
const CITY_GROUP_NAMES = 3;

// The city with the most scooters takes in its neighbours on screen and stays where it is,
// so a group sits on a real city and keeps its place while the map is panned.
export function groupCityTotals(cities: ScooterCluster[], zoom: number): CityGroup[] {
  const ordered = cities
    .map(city => ({ city, point: worldPixel(city, zoom) }))
    .sort((a, b) => b.city.count - a.city.count || a.city.id.localeCompare(b.city.id));
  const taken = new Set<string>();
  const groups: CityGroup[] = [];
  for (const head of ordered) {
    if (taken.has(head.city.id)) continue;
    const members = ordered.filter(other => !taken.has(other.city.id) &&
      Math.hypot(other.point[0] - head.point[0], other.point[1] - head.point[1]) < CITY_GROUP_SPACING_PX);
    for (const member of members) taken.add(member.city.id);
    if (members.length === 1) {
      groups.push(head.city);
      continue;
    }

    const providers: Record<string, number> = {};
    for (const { city } of members) {
      for (const [provider, count] of Object.entries(city.providers)) providers[provider] = (providers[provider] ?? 0) + count;
    }
    const names = members.map(member => member.city.city).filter((name): name is string => Boolean(name));
    groups.push({
      ...head.city,
      id: `group:${head.city.id}`,
      city: names.length > CITY_GROUP_NAMES ? `${names.slice(0, CITY_GROUP_NAMES).join(', ')}…` : names.join(', '),
      count: members.reduce((total, member) => total + member.city.count, 0),
      providers,
      bounds: {
        south: Math.min(...members.map(member => member.city.lat)),
        west: Math.min(...members.map(member => member.city.lng)),
        north: Math.max(...members.map(member => member.city.lat)),
        east: Math.max(...members.map(member => member.city.lng)),
      },
    });
  }
  return groups;
}
