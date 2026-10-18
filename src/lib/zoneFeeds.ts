import { validateDiscovery, validateTypes } from './feedValidation';
import { discoveryFeedEntries, discoveredFeedUrl, fetchJson } from './scooterFeeds';
import { nextZoneChange, normalizeZones, validateZones, type StoredZone, type ZonesFeed, type ZoneTypesFeed } from './zones';

/** Where a GBFS feed's zones are found: its discovery document, and the address its documents must be under. */
export interface ZoneSource {
  discoveryUrl: string;
  baseUrl: string;
  /** sharedmobility.ch asks its clients to name themselves. */
  authenticated?: boolean;
}

const normalized = new Map<string, { types: ZoneTypesFeed; zones: ZonesFeed; until: number; result: StoredZone[] }>();

/** The zones of one feed, from documents kept for an hour: none when it publishes none, or no scooter type. */
export async function fetchFeedZones(feedId: string, provider: string, source: ZoneSource): Promise<StoredZone[]> {
  const options = { authenticated: source.authenticated, revalidate: 3600 };
  const discovery = await fetchJson<Parameters<typeof discoveryFeedEntries>[0]>(source.discoveryUrl,
    { ...options, validate: validateDiscovery });
  const entries = discoveryFeedEntries(discovery.data);
  const zonesUrl = discoveredFeedUrl(entries, 'geofencing_zones', source.baseUrl);
  const typesUrl = discoveredFeedUrl(entries, 'vehicle_types', source.baseUrl);
  if (!zonesUrl || !typesUrl) return [];
  const [types, zones] = await Promise.all([
    fetchJson<ZoneTypesFeed>(typesUrl, { ...options, validate: validateTypes }),
    fetchJson<ZonesFeed>(zonesUrl, { ...options, validate: validateZones }),
  ]);
  const now = Date.now();
  let cached = normalized.get(feedId);
  // A zone applies only from its start to its end, so it is read again at the next of those times.
  if (!cached || cached.types !== types.data || cached.zones !== zones.data || now >= cached.until) {
    cached = { types: types.data, zones: zones.data, until: nextZoneChange(zones.data, now),
      result: normalizeZones(feedId, provider, types.data, zones.data, now) };
    normalized.set(feedId, cached);
  }
  return cached.result;
}
