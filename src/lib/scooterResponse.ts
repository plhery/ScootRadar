import { clusterVehicles, shouldClusterAtZoom } from '@/lib/clustering';
import { MAX_SCOOTER_RESULTS } from '@/lib/scooterQuery';
import type { ScooterFetchResult } from '@/lib/scooterFeeds';
import { COUNTRY_DATA_ATTRIBUTION } from '@/generated/countries';
import type { ScooterResponse, ScooterResponseMeta, Vehicle } from '@/lib/types';
import { VEHICLE_MAX_AGE_MS } from './dataFreshness';

// Each country's data, from data/countries.json, then the parking of Lille's open data.
export const MOBILITY_SOURCE = `${COUNTRY_DATA_ATTRIBUTION}; Lille parking: Metropole Europeenne de Lille`;

/**
 * `lastSeen`: scooters of slow feeds being collected again, where they were last seen. They are
 * grouped as the others are, in groups of their own, within what is left of the result limit, and
 * counted nowhere: the map shows them faded until the sweep under way reaches them.
 */
export function scooterResponse(
  result: ScooterFetchResult,
  zoom: number | null,
  metadata: Partial<ScooterResponseMeta> = {},
  lastSeen: Vehicle[] = [],
): ScooterResponse {
  const clustered = zoom !== null && shouldClusterAtZoom(zoom);
  const represent = (list: Vehicle[]) => clustered ? clusterVehicles(list, zoom) : { vehicles: list, clusters: [] };
  const representation = represent(result.vehicles);
  const clusters = representation.clusters.slice(0, MAX_SCOOTER_RESULTS);
  const vehicles = representation.vehicles.slice(0, Math.max(MAX_SCOOTER_RESULTS - clusters.length, 0));
  const providers: Record<string, number> = {};
  for (const vehicle of result.vehicles) {
    providers[vehicle.provider] = (providers[vehicle.provider] ?? 0) + 1;
  }
  let room = MAX_SCOOTER_RESULTS - clusters.length - vehicles.length;
  const seen = lastSeen.length ? represent(lastSeen) : null;
  // Prefixed: a group of last-seen scooters may stand in the same cell as a group of the others.
  const seenClusters = seen?.clusters.slice(0, Math.max(room, 0)).map(cluster => ({ ...cluster, id: `seen:${cluster.id}` })) ?? [];
  room -= seenClusters.length;
  const seenVehicles = seen?.vehicles.slice(0, Math.max(room, 0)) ?? [];
  return {
    vehicles, clusters, providers,
    ...(seen ? { lastSeen: { vehicles: seenVehicles, clusters: seenClusters } } : {}),
    meta: {
      expiresAt: new Date(Date.now() + VEHICLE_MAX_AGE_MS).toISOString(),
      ...result.meta,
      generatedAt: new Date().toISOString(),
      truncated: clusters.length < representation.clusters.length || vehicles.length < representation.vehicles.length,
      totalVehicles: result.vehicles.length,
      mode: clustered ? 'clusters' : 'vehicles',
      zoom,
      ...metadata,
    },
  };
}

export function scooterResponseHeaders(body: ScooterResponse): Record<string, string> {
  const degraded = body.meta.partial || body.meta.stale;
  return {
    // A response asking to be polled again in a few seconds must not answer that poll itself.
    'Cache-Control': body.meta.refreshing ? 'no-store'
      : body.meta.overview
      ? 'public, max-age=300, s-maxage=300, stale-while-revalidate=300'
      : degraded
        ? 'public, max-age=10, s-maxage=10, stale-while-revalidate=30'
        : 'public, max-age=30, s-maxage=30, stale-while-revalidate=60',
    'X-Mobility-Data-Source': MOBILITY_SOURCE,
    'X-Mobility-Data-Status': body.meta.partial ? 'partial' : body.meta.stale ? 'stale' : 'fresh',
  };
}
