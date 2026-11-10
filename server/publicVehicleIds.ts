import { randomBytes } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { open } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { haversineM } from '../src/lib/geo';
import type { ScooterResponse, Vehicle } from '../src/lib/types';

/**
 * How far a scooter may stand from where it got its public id before it gets another: past a parked scooter's
 * GPS jitter, short of a ride.
 */
export const PUBLIC_ID_MOVED_M = 100;
/**
 * How long a scooter missing from every answer keeps its id, for as long as it stands where it got it: a day,
 * through a phone locked for many minutes on the way to it, a deploy, or a night nobody looks at its street. A
 * ride moves it, and gives it a new id. Until 10 November 2026 one was renamed after 5 minutes away: a scooter
 * walked to with the phone locked came back under a new id, and a walk took a renamed neighbour for it (week
 * review, finding 1.2).
 */
export const PUBLIC_ID_KEPT_MS = 24 * 60 * 60_000;
/**
 * As long only, for a scooter of a feed whose licence caps how long its data may be kept (retentionCaps in
 * cadence.ts): Bird's, Spin's and Bolt's own GBFS, of which Bird's and Spin's rename every scooter on every read.
 */
export const PUBLIC_ID_CAPPED_KEPT_MS = 5 * 60_000;
/**
 * At most so many are kept, the longest out of the answers going first: a day of the feeds that rename every
 * scooter on every read, as Bird's and Pony's, leaves many nothing will ask for again.
 */
const MAX_KEPT = 300_000;
/** How often the ids kept past their time are let go. */
const SWEEP_EVERY_MS = 5 * 60_000;

interface Issued {
  id: string;
  /** Where the scooter stood when it got the id. */
  lat: number;
  lng: number;
  seenAt: number;
  /** How long after seenAt it is kept: PUBLIC_ID_KEPT_MS, or PUBLIC_ID_CAPPED_KEPT_MS. */
  keptMs: number;
}

/** An id as saved for a restart: the operator's scooter, its id, where it got it, when last in an answer and for how long after. */
export type SavedPublicId = [key: string, id: string, lat: number, lng: number, seenAt: number, keptMs: number];

export interface PublicVehicleIds {
  /** The answer with each scooter's id replaced by its public one. */
  publish(body: ScooterResponse, now: number): ScooterResponse;
  /** How many scooters have an id that is still in use. */
  size(): number;
  /** Every id kept, the longest out of the answers first, for a restart to take back (restore). */
  saved(): IterableIterator<SavedPublicId>;
  /** Takes back the ids saved before a restart, those past their time left out, as given before any answer. */
  restore(saved: Iterable<SavedPublicId>, now: number): void;
}

/**
 * The ids the answers give scooters. The rider maps name each scooter by the operator's own id, which it keeps
 * from ride to ride, so a feed of them would let anyone rebuild every trip; an operator's GBFS feed gives a
 * scooter a new id after each ride for that reason. An answer gives it a random id of its own instead, kept
 * while the scooter stands within PUBLIC_ID_MOVED_M of where it got it, in the answers or missing from them for
 * up to PUBLIC_ID_KEPT_MS, and a new one once it has moved further. One that comes back where it stood after a
 * ride nobody saw keeps its id, which says no more than that it stands there again. The apps follow a scooter to
 * its new id: one of its operator's standing within a few metres of where it stood. The cache saves them beside
 * the snapshot, with it, and a restart takes them back (writePublicVehicleIds), so a deploy renames none.
 *
 * `capped` tells a scooter of a feed with a licence's cap on keeping its data by its id (PUBLIC_ID_CAPPED_KEPT_MS).
 */
export function createPublicVehicleIds(options: { movedM?: number; keptMs?: number; cappedKeptMs?: number; maxKept?: number;
  capped?: (vehicleId: string) => boolean } = {}): PublicVehicleIds {
  const movedM = options.movedM ?? PUBLIC_ID_MOVED_M;
  const keptMs = options.keptMs ?? PUBLIC_ID_KEPT_MS;
  const cappedKeptMs = options.cappedKeptMs ?? PUBLIC_ID_CAPPED_KEPT_MS;
  const maxKept = options.maxKept ?? MAX_KEPT;
  // By when each was last in an answer, the longest ago first.
  const issued = new Map<string, Issued>();
  let sweptAt = -Infinity;

  const trim = () => {
    for (const key of issued.keys()) {
      if (issued.size <= maxKept) break;
      issued.delete(key);
    }
  };
  // Kept for one time or the other, they are not in the order they go: each is looked at.
  const sweep = (now: number) => {
    for (const [key, entry] of issued) if (now - entry.seenAt > entry.keptMs) issued.delete(key);
  };

  const publicId = (vehicle: Vehicle, now: number): string | null => {
    if (!vehicle.vehicle_id) return null;
    const key = `${vehicle.provider}:${vehicle.vehicle_id}`;
    let entry = issued.get(key);
    if (!entry || now - entry.seenAt > entry.keptMs || haversineM(entry.lat, entry.lng, vehicle.lat, vehicle.lng) > movedM) {
      entry = { id: randomBytes(9).toString('base64url'), lat: vehicle.lat, lng: vehicle.lng, seenAt: now,
        keptMs: options.capped?.(vehicle.vehicle_id) ? cappedKeptMs : keptMs };
    } else {
      entry.seenAt = now;
    }
    issued.delete(key);
    issued.set(key, entry);
    return entry.id;
  };

  const published = (vehicles: Vehicle[], now: number) =>
    vehicles.map(vehicle => vehicle.vehicle_id ? { ...vehicle, vehicle_id: publicId(vehicle, now) } : vehicle);

  return {
    publish(body, now) {
      if (now - sweptAt >= SWEEP_EVERY_MS) {
        sweptAt = now;
        sweep(now);
      }
      const result = { ...body, vehicles: published(body.vehicles, now) };
      if (body.lastSeen) result.lastSeen = { ...body.lastSeen, vehicles: published(body.lastSeen.vehicles, now) };
      trim();
      return result;
    },
    size: () => issued.size,
    saved() {
      // The keys of now: an id moved to the end by an answer while it is written is written once, where it stood.
      const keys = [...issued.keys()];
      return (function* () {
        for (const key of keys) {
          const entry = issued.get(key);
          if (entry) yield [key, entry.id, entry.lat, entry.lng, entry.seenAt, entry.keptMs] satisfies SavedPublicId;
        }
      })();
    },
    restore(saved, now) {
      for (const [key, id, lat, lng, seenAt, kept] of saved) {
        if (now - seenAt <= kept && !issued.has(key)) issued.set(key, { id, lat, lng, seenAt, keptMs: kept });
      }
      trim();
    },
  };
}

// Saved beside the snapshot, with it, as one JSON document written an id to a line, as the snapshot a feed to a
// line (snapshotFile.ts), and read back the same way: a day's ids may be as many as MAX_KEPT.
//
//   {"version":1,"savedAt":…,"ids":[
//   ["lime:…","…",47.37,8.54,…,86400000],
//   ["dott:…","…",47.38,8.55,…,86400000]
//   ]}
const IDS_START = ',"ids":[';
const IDS_END = ']}';

/** Writes the ids `saved` gave to the path, an id at a time. */
export async function writePublicVehicleIds(path: string, saved: Iterable<SavedPublicId>, savedAt: number): Promise<void> {
  await pipeline(function* lines() {
    let first = true;
    yield `{"version":1,"savedAt":${savedAt}${IDS_START}`;
    for (const entry of saved) {
      yield `${first ? '' : ','}\n${JSON.stringify(entry)}`;
      first = false;
    }
    yield `\n${IDS_END}\n`;
  }, createWriteStream(path));
}

const isSavedId = (value: unknown): value is SavedPublicId => Array.isArray(value) && value.length === 6 &&
  typeof value[0] === 'string' && typeof value[1] === 'string' && value.slice(2).every(Number.isFinite);

/** The ids writePublicVehicleIds wrote, those that cannot be read left out. Rejects a file cut short or of another version. */
export async function readPublicVehicleIds(path: string): Promise<SavedPublicId[]> {
  const file = await open(path);
  const ids: SavedPublicId[] = [];
  let started = false, ended = false;
  try {
    for await (const line of file.readLines({ encoding: 'utf8' })) {
      if (ended) {
        if (line) throw new Error('Public id file continues after its end');
      } else if (!started) {
        if (!line.startsWith('{"version":1,') || !line.endsWith(IDS_START)) throw new Error('Public id file of another version');
        started = true;
      } else if (line === IDS_END) {
        ended = true;
      } else {
        const entry: unknown = JSON.parse(line.endsWith(',') ? line.slice(0, -1) : line);
        if (isSavedId(entry)) ids.push(entry);
      }
    }
  } finally {
    await file.close().catch(() => {});
  }
  if (!ended) throw new Error('Public id file is cut short');
  return ids;
}
