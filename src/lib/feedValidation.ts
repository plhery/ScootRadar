import { PARKING_MAX_AGE_MS, VEHICLE_MAX_AGE_MS } from './dataFreshness';

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid feed object');
  return value as Record<string, unknown>;
}

function records(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error('Invalid feed array');
  return value.map(object);
}

export function validateRegistry(value: unknown): void {
  for (const entry of records(object(value).systems)) {
    if (typeof entry.id !== 'string' || typeof entry.url !== 'string') throw new Error('Invalid registry entry');
  }
}

export function validateDiscovery(value: unknown): void {
  const data = object(object(value).data);
  const candidates = Array.isArray(data.feeds) ? [data] : Object.values(data);
  const feeds = candidates.flatMap(candidate => {
    if (!candidate || typeof candidate !== 'object' || !('feeds' in candidate)) return [];
    return records(candidate.feeds);
  });
  if (!feeds.length || feeds.some(entry => typeof entry.name !== 'string' || typeof entry.url !== 'string')) {
    throw new Error('Invalid discovery feeds');
  }
}

export function validateTypes(value: unknown): void {
  for (const type of records(object(object(value).data).vehicle_types)) {
    if (typeof type.vehicle_type_id !== 'string') throw new Error('Invalid vehicle type');
  }
}

/**
 * A status document whose time is missing, past its age limit or more than 5 minutes ahead of ours. The message is
 * the same whichever it is, as Sentry has always had it; `statusAgeSeconds` tells them apart: the age the document
 * gave itself when it was read, negative when ahead of our clock, null when it gave no time we can read. The feed's
 * `observationAgeSeconds` is another figure, the age of the last observation we accepted: on 8 November 2026 NRW's
 * Voi feeds expired with one 2,602 seconds old, which said nothing of what NRW was sending.
 */
export class StatusTimestampError extends Error {
  readonly statusAgeSeconds: number | null;

  constructor(statusAgeSeconds: number | null) {
    super('Status timestamp is missing or out of date');
    this.statusAgeSeconds = statusAgeSeconds;
  }
}

/** For a log line: the rejected status document's age, when that is why `error` was thrown. */
export function statusAge(error: unknown): { statusAgeSeconds?: number | null } {
  return error instanceof StatusTimestampError ? { statusAgeSeconds: error.statusAgeSeconds } : {};
}

export function statusObservedAt(value: unknown, now = Date.now(), maximumAgeMs = VEHICLE_MAX_AGE_MS): number {
  const timestamp = object(value).last_updated;
  const updatedAt = typeof timestamp === 'number' ? timestamp * 1000
    : typeof timestamp === 'string' ? Date.parse(timestamp) : NaN;
  if (!Number.isFinite(updatedAt) || now - updatedAt > maximumAgeMs || updatedAt - now > 300_000) {
    throw new StatusTimestampError(Number.isFinite(updatedAt) ? Math.round((now - updatedAt) / 1000) : null);
  }
  return Math.min(now, updatedAt);
}

/**
 * When a fetched status document was observed (statusObservedAt). A copy served because its request failed
 * (upstreamJsonCache's `failure`) ages past the limit in turn: when that request failed on the operator's document's
 * own time, its error is the one thrown, so the age it gives is that of what the operator sends, not of our copy.
 */
export function fetchedStatusObservedAt(status: { data: unknown; failure?: unknown }, now = Date.now(),
  maximumAgeMs = VEHICLE_MAX_AGE_MS): number {
  try {
    return statusObservedAt(status.data, now, maximumAgeMs);
  } catch (error) {
    throw error instanceof StatusTimestampError && status.failure instanceof StatusTimestampError ? status.failure : error;
  }
}

const ABANDONED_STATUS_AGE_MS = 7 * 24 * 3600_000;

/**
 * A status feed its operator no longer updates: last updated over a week ago,
 * or never (a zero timestamp). sharedmobility.ch keeps such systems in its
 * catalogue long after the operator has stopped sending positions.
 */
export function isAbandonedStatus(value: unknown, now = Date.now()): boolean {
  const timestamp = value && typeof value === 'object' ? (value as { last_updated?: unknown }).last_updated : undefined;
  return typeof timestamp === 'number' && (timestamp === 0 || now - timestamp * 1000 > ABANDONED_STATUS_AGE_MS);
}

/**
 * A status feed with no vehicles and no time, `last_updated` 0: what Bird serves for a town where
 * it has no scooter out, as Saskatoon out of season or Calgary on a snow day. An empty town, not
 * a late feed; with a single vehicle in it, a zero time is still out of date.
 */
export function isEmptyUndatedStatus(value: unknown): boolean {
  if (!value || typeof value !== 'object' || (value as { last_updated?: unknown }).last_updated !== 0) return false;
  const data = (value as { data?: unknown }).data;
  const vehicles = data && typeof data === 'object' ? (data as { bikes?: unknown; vehicles?: unknown }) : {};
  const list = vehicles.bikes ?? vehicles.vehicles;
  return Array.isArray(list) && list.length === 0;
}

export function validateVehicleStatus(value: unknown): void {
  statusObservedAt(value);
  const data = object(object(value).data);
  records(data.bikes ?? data.vehicles);
}

export function validateStations(value: unknown): void {
  for (const station of records(object(object(value).data).stations)) {
    if (typeof station.station_id !== 'string') throw new Error('Invalid station ID');
  }
}

export function validateStationStatus(value: unknown): void {
  validateStations(value);
  statusObservedAt(value, Date.now(), PARKING_MAX_AGE_MS);
}
