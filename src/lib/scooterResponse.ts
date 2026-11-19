import { clusterVehicles, shouldClusterAtZoom } from '@/lib/clustering';
import { MAX_SCOOTER_RESULTS } from '@/lib/scooterQuery';
import type { ScooterFetchResult } from '@/lib/scooterFeeds';
import { COUNTRY_ATTRIBUTIONS, COUNTRY_SOURCES, type CountryCode } from '@/generated/countries';
import type { LastSeenProvider } from '@/generated/scooterApi';
import type { ScooterResponse, ScooterResponseMeta, Vehicle } from '@/lib/types';
import { VEHICLE_MAX_AGE_MS } from './dataFreshness';

/** Where every source of the map and its licence is named (DATA_SOURCES.md), which each answer's header links to. */
export const DATA_CREDITS_URL = 'https://github.com/plhery/ScootRadar/blob/main/DATA_SOURCES.md';
const LILLE_PARKING = 'Lille parking: Metropole Europeenne de Lille';
// Switzerland's own sources besides its country catalog's.
const SOURCE_COUNTRY = new Map<string, CountryCode>([['national', 'CH'], ['hopp', 'CH'], ['publibike', 'CH'],
  ...Object.entries(COUNTRY_SOURCES).map(([country, source]): [string, CountryCode] => [source, country as CountryCode])]);

/**
 * Whose data the answer holds, for its X-Mobility-Data-Source header: the whole attribution of each country whose
 * feeds it was made from (data/countries.json), as the licences ask of the data shared (NLOD, dl-de/by-2-0,
 * CC BY and BY-SA, ODbL, CDLA-Permissive-2.0, Licence Ouverte, opendata.swiss's BY), Lille's parking where it has
 * any, and where all of them are named. It named every country, about 6 KB on each answer, past what HPACK keeps.
 */
export function mobilitySource(body: Pick<ScooterResponse, 'meta' | 'parking'>): string {
  const countries = new Set<string>();
  for (const [source, status] of Object.entries(body.meta.sources ?? {})) {
    const country = SOURCE_COUNTRY.get(source);
    if (country && status !== 'skipped') countries.add(country);
  }
  const named = (Object.keys(COUNTRY_ATTRIBUTIONS) as CountryCode[]).filter(country => countries.has(country))
    .map(country => COUNTRY_ATTRIBUTIONS[country]);
  if (body.parking?.length) named.push(LILLE_PARKING);
  return [...named, `All sources and licences: ${DATA_CREDITS_URL}`].join('; ');
}

/**
 * `lastSeen`: scooters of slow feeds being collected again, where they were last seen. They are
 * grouped as the others are, in groups of their own, within what is left of the result limit, and
 * counted nowhere: the map shows them faded until the sweep under way reaches them. `lastSeenProviders`
 * says of each app when its were seen and whether new positions are on their way; the answer keeps
 * those of the apps among the scooters it holds. The result's batteryRanges are given where it has any.
 */
export function scooterResponse(
  result: ScooterFetchResult,
  zoom: number | null,
  metadata: Partial<ScooterResponseMeta> = {},
  lastSeen: Vehicle[] = [],
  lastSeenProviders: Readonly<Record<string, LastSeenProvider>> = {},
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
  const held = new Set([...seenVehicles.map(vehicle => vehicle.provider), ...seenClusters.flatMap(cluster => Object.keys(cluster.providers))]);
  const seenProviders = Object.fromEntries(Object.entries(lastSeenProviders).filter(([provider]) => held.has(provider)));
  return {
    vehicles, clusters, providers,
    ...(result.batteryRanges && Object.keys(result.batteryRanges).length ? { batteryRanges: result.batteryRanges } : {}),
    ...(seen ? { lastSeen: { vehicles: seenVehicles, clusters: seenClusters,
      ...(Object.keys(seenProviders).length ? { providers: seenProviders } : {}) } } : {}),
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
    'X-Mobility-Data-Source': mobilitySource(body),
    'X-Mobility-Data-Status': body.meta.partial ? 'partial' : body.meta.stale ? 'stale' : 'fresh',
  };
}

/**
 * A Server-Timing header of the steps that made an answer, in milliseconds, "read;dur=0.4, filter;dur=2.1": what
 * the browser's and RUM's timings of the request can then say of where its time went.
 */
export function serverTiming(steps: Readonly<Record<string, number>>): string {
  return Object.entries(steps).map(([name, ms]) => `${name};dur=${Math.max(0, ms).toFixed(1)}`).join(', ');
}
