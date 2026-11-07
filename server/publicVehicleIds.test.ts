import { describe, expect, it } from 'vitest';
import { createPublicVehicleIds, PUBLIC_ID_GAP_MS } from './publicVehicleIds';
import type { ScooterResponse, Vehicle } from '../src/lib/types';

// About 11 m of latitude per 0.0001°.
const scooter = (id: string | null, lat = 47.3769, lng = 8.5417, provider = 'bolt'): Vehicle => ({ provider, vehicle_id: id, lat, lng,
  battery: 80, range_m: null, deep_link: null, distance_m: null });
const answer = (vehicles: Vehicle[], lastSeen?: Vehicle[]) => ({ vehicles, clusters: [], providers: {},
  ...(lastSeen ? { lastSeen: { vehicles: lastSeen, clusters: [] } } : {}), meta: {} }) as unknown as ScooterResponse;
const start = Date.UTC(2026, 10, 7, 9);

describe('public vehicle ids', () => {
  it('names a scooter by an id of its own, kept while it stands where it got it', () => {
    const ids = createPublicVehicleIds();
    const first = ids.publish(answer([scooter('bolt_ch_zurich:4711')]), start).vehicles[0].vehicle_id!;
    expect(first).not.toContain('4711');
    expect(first).toMatch(/^[\w-]{12}$/);
    // Standing still, with its GPS jitter, and asked every minute for half an hour.
    for (let minute = 1; minute <= 30; minute++) {
      const jitter = (minute % 3 - 1) * 0.0003;
      expect(ids.publish(answer([scooter('bolt_ch_zurich:4711', 47.3769 + jitter, 8.5417 - jitter)]), start + minute * 60_000)
        .vehicles[0].vehicle_id).toBe(first);
    }
  });

  it('gives a scooter a new id once it has moved, as after a ride', () => {
    const ids = createPublicVehicleIds();
    const parked = ids.publish(answer([scooter('lime:a')]), start).vehicles[0].vehicle_id;
    const ridden = ids.publish(answer([scooter('lime:a', 47.3869)]), start + 60_000).vehicles[0].vehicle_id;
    expect(ridden).not.toBe(parked);
    // And keeps that one where it now stands.
    expect(ids.publish(answer([scooter('lime:a', 47.3869)]), start + 120_000).vehicles[0].vehicle_id).toBe(ridden);
  });

  it('measures the move from where it got its id, so a scooter creeping away gets a new one too', () => {
    const ids = createPublicVehicleIds();
    const seen = Array.from({ length: 6 }, (_, step) =>
      ids.publish(answer([scooter('dott:a', 47.3769 + step * 0.00028)]), start + step * 60_000).vehicles[0].vehicle_id);
    // 31 m a step: 93 m from where it got the id at the third, 125 m at the fourth.
    expect(new Set(seen.slice(0, 4)).size).toBe(1);
    expect(seen[4]).not.toBe(seen[0]);
  });

  it('gives a new id to a scooter back after missing from the answers, as through a ride that ends where it began', () => {
    const ids = createPublicVehicleIds();
    const before = ids.publish(answer([scooter('voi:a')]), start).vehicles[0].vehicle_id;
    expect(ids.publish(answer([scooter('voi:a')]), start + PUBLIC_ID_GAP_MS).vehicles[0].vehicle_id).toBe(before);
    expect(ids.publish(answer([]), start + 2 * PUBLIC_ID_GAP_MS).vehicles).toEqual([]);
    expect(ids.publish(answer([scooter('voi:a')]), start + 2 * PUBLIC_ID_GAP_MS + 1).vehicles[0].vehicle_id).not.toBe(before);
  });

  it('keeps apart the operators, names the faded scooters too, and leaves the rest of the answer as it was', () => {
    const ids = createPublicVehicleIds();
    const body = answer([scooter('7'), scooter('7', 47.3769, 8.5417, 'lime'), scooter(null)], [scooter('8', 47.38)]);
    const published = ids.publish(body, start);
    const [bolt, lime, nameless] = published.vehicles;
    expect(bolt.vehicle_id).not.toBe(lime.vehicle_id);
    expect(nameless.vehicle_id).toBeNull();
    expect(published.lastSeen!.vehicles[0].vehicle_id).not.toBe('8');
    const unnamed = (vehicle: Vehicle) => ({ ...vehicle, vehicle_id: null });
    expect(published.vehicles.map(unnamed)).toEqual(body.vehicles.map(unnamed));
    // The answer it was given is not changed.
    expect(body.vehicles[0].vehicle_id).toBe('7');
    expect(published.clusters).toBe(body.clusters);
  });

  it('keeps only the ids still in use, and at most so many', () => {
    const ids = createPublicVehicleIds({ maxKept: 3 });
    ids.publish(answer(['a', 'b'].map(id => scooter(id))), start);
    expect(ids.size()).toBe(2);
    ids.publish(answer([scooter('c')]), start + PUBLIC_ID_GAP_MS + 1);
    expect(ids.size()).toBe(1);
    const kept = ids.publish(answer([scooter('d')]), start + PUBLIC_ID_GAP_MS + 2).vehicles[0].vehicle_id;
    ids.publish(answer(['e', 'f', 'g'].map(id => scooter(id))), start + PUBLIC_ID_GAP_MS + 3);
    expect(ids.size()).toBe(3);
    // The one longest out of the answers went first.
    expect(ids.publish(answer([scooter('d')]), start + PUBLIC_ID_GAP_MS + 4).vehicles[0].vehicle_id).not.toBe(kept);
  });
});
