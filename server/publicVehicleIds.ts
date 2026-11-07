import { randomBytes } from 'node:crypto';
import { haversineM } from '../src/lib/geo';
import type { ScooterResponse, Vehicle } from '../src/lib/types';

/**
 * How far a scooter may stand from where it got its public id before it gets another: past a parked scooter's
 * GPS jitter, short of a ride.
 */
export const PUBLIC_ID_MOVED_M = 100;
/**
 * How long a scooter may be missing from every answer before it comes back under a new id: through a ride, or
 * after nobody looked at it for a while.
 */
export const PUBLIC_ID_GAP_MS = 5 * 60_000;
const MAX_KEPT = 300_000;

interface Issued {
  id: string;
  /** Where the scooter stood when it got the id. */
  lat: number;
  lng: number;
  seenAt: number;
}

export interface PublicVehicleIds {
  /** The answer with each scooter's id replaced by its public one. */
  publish(body: ScooterResponse, now: number): ScooterResponse;
  /** How many scooters have an id that is still in use. */
  size(): number;
}

/**
 * The ids the answers give scooters. The rider maps name each scooter by the operator's own id, which it keeps
 * from ride to ride, so a feed of them would let anyone rebuild every trip; an operator's GBFS feed gives a
 * scooter a new id after each ride for that reason. An answer gives it a random id of its own instead, kept
 * while the scooter stands where it got it and is in the answers, and a new one once it has moved
 * PUBLIC_ID_MOVED_M or been missing for PUBLIC_ID_GAP_MS. The apps follow a scooter to its new id: one of its
 * operator's standing within a few metres of where it stood. The ids are kept in memory only, so a restart
 * gives every scooter a new one.
 */
export function createPublicVehicleIds(options: { movedM?: number; gapMs?: number; maxKept?: number } = {}): PublicVehicleIds {
  const movedM = options.movedM ?? PUBLIC_ID_MOVED_M;
  const gapMs = options.gapMs ?? PUBLIC_ID_GAP_MS;
  const maxKept = options.maxKept ?? MAX_KEPT;
  // By when each was last in an answer, the longest ago first.
  const issued = new Map<string, Issued>();
  let sweptAt = -Infinity;

  const sweep = (now: number) => {
    for (const [key, entry] of issued) {
      if (now - entry.seenAt <= gapMs && issued.size <= maxKept) break;
      issued.delete(key);
    }
  };

  const publicId = (vehicle: Vehicle, now: number): string | null => {
    if (!vehicle.vehicle_id) return null;
    const key = `${vehicle.provider}:${vehicle.vehicle_id}`;
    let entry = issued.get(key);
    if (!entry || now - entry.seenAt > gapMs || haversineM(entry.lat, entry.lng, vehicle.lat, vehicle.lng) > movedM) {
      entry = { id: randomBytes(9).toString('base64url'), lat: vehicle.lat, lng: vehicle.lng, seenAt: now };
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
      if (now - sweptAt >= gapMs || issued.size > maxKept) {
        sweptAt = now;
        sweep(now);
      }
      const result = { ...body, vehicles: published(body.vehicles, now) };
      if (body.lastSeen) result.lastSeen = { ...body.lastSeen, vehicles: published(body.lastSeen.vehicles, now) };
      if (issued.size > maxKept) sweep(now);
      return result;
    },
    size: () => issued.size,
  };
}
