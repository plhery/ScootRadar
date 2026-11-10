import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createPublicVehicleIds, PUBLIC_ID_CAPPED_KEPT_MS, PUBLIC_ID_KEPT_MS, readPublicVehicleIds, writePublicVehicleIds } from './publicVehicleIds';
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

  it('keeps the id of a scooter back where it stood after missing from the answers, through a locked phone and a night', () => {
    const ids = createPublicVehicleIds();
    const id = (vehicle: Vehicle, at: number) => ids.publish(answer([vehicle]), at).vehicles[0].vehicle_id;
    // A walk to an 80% Lime with a 10% one 9 m away, the phone locked 6 minutes on the way, nobody else looking.
    const walked = id(scooter('lime:80'), start), beside = id(scooter('lime:10', 47.37698), start);
    expect(ids.publish(answer([]), start + 3 * 60_000).vehicles).toEqual([]);
    expect(id(scooter('lime:10', 47.37698), start + 6 * 60_000)).toBe(beside);
    expect(id(scooter('lime:80'), start + 6 * 60_000)).toBe(walked);
    // Seen at 18:00 and not again until 08:00.
    expect(id(scooter('lime:80', 47.37695), start + 6 * 60_000 + 14 * 3600_000)).toBe(walked);
    // A ride that ends elsewhere gives a new one, kept there; one back where it began after it, another.
    const elsewhere = id(scooter('lime:80', 47.3869), start + 15 * 3600_000);
    expect(elsewhere).not.toBe(walked);
    expect(id(scooter('lime:80', 47.3869), start + 17 * 3600_000)).toBe(elsewhere);
    expect(id(scooter('lime:80'), start + 18 * 3600_000)).not.toBe(walked);
    // A day out of the answers, a new one.
    const again = id(scooter('lime:10', 47.37698), start + 6 * 60_000 + PUBLIC_ID_KEPT_MS + 1);
    expect(again).not.toBe(beside);
  });

  it('renews after 5 minutes out of the answers the id of a scooter of a feed whose licence caps how long its data is kept', () => {
    // Bird's own GBFS in Zürich, capped at 15 minutes, beside Bird's map in Austin.
    const ids = createPublicVehicleIds({ capped: vehicleId => vehicleId.startsWith('bird-zurich:') });
    const id = (vehicle: Vehicle, at: number) => ids.publish(answer([vehicle]), at).vehicles[0].vehicle_id;
    const gbfs = id(scooter('bird-zurich:1', 47.3769, 8.5417, 'bird'), start);
    const map = id(scooter('bird:00000000-0000-4000-8000-000000000001', 30.27, -97.74, 'bird'), start);
    expect(id(scooter('bird-zurich:1', 47.3769, 8.5417, 'bird'), start + PUBLIC_ID_CAPPED_KEPT_MS)).toBe(gbfs);
    const later = start + 2 * PUBLIC_ID_CAPPED_KEPT_MS + 1;
    expect(id(scooter('bird-zurich:1', 47.3769, 8.5417, 'bird'), later)).not.toBe(gbfs);
    expect(id(scooter('bird:00000000-0000-4000-8000-000000000001', 30.27, -97.74, 'bird'), later)).toBe(map);
    // Let go once past its time, the capped one with it.
    ids.publish(answer([]), later + PUBLIC_ID_CAPPED_KEPT_MS + 1);
    expect([...ids.saved()].map(([key]) => key)).toEqual(['bird:bird:00000000-0000-4000-8000-000000000001']);
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
    ids.publish(answer([scooter('c')]), start + PUBLIC_ID_KEPT_MS + 1);
    expect(ids.size()).toBe(1);
    const kept = ids.publish(answer([scooter('d')]), start + PUBLIC_ID_KEPT_MS + 2).vehicles[0].vehicle_id;
    ids.publish(answer(['e', 'f', 'g'].map(id => scooter(id))), start + PUBLIC_ID_KEPT_MS + 3);
    expect(ids.size()).toBe(3);
    // The one longest out of the answers went first.
    expect(ids.publish(answer([scooter('d')]), start + PUBLIC_ID_KEPT_MS + 4).vehicles[0].vehicle_id).not.toBe(kept);
  });

  describe('across a restart', () => {
    const withFile = async (run: (path: string) => Promise<void>) => {
      const directory = await mkdtemp(join(tmpdir(), 'scootradar-public-ids-'));
      try { await run(join(directory, 'public-ids.json')); } finally { await rm(directory, { recursive: true, force: true }); }
    };

    it('names every scooter as before a deploy, from the file saved beside the snapshot', () => withFile(async path => {
      const before = createPublicVehicleIds({ capped: vehicleId => vehicleId.startsWith('bird-zurich:') });
      const fleet = [scooter('lime:80'), scooter('lime:10', 47.37698), scooter('bird-zurich:1', 47.3769, 8.5417, 'bird')];
      const named = before.publish(answer(fleet), start).vehicles.map(vehicle => vehicle.vehicle_id);
      // Last saved a minute later, the restart two minutes after.
      await writePublicVehicleIds(path, before.saved(), start + 60_000);
      const after = createPublicVehicleIds();
      after.restore(await readPublicVehicleIds(path), start + 3 * 60_000);
      expect(after.publish(answer(fleet), start + 3 * 60_000).vehicles.map(vehicle => vehicle.vehicle_id)).toEqual(named);
      // Each keeps its own time: the capped one's 5 minutes, the others' day.
      const late = start + PUBLIC_ID_CAPPED_KEPT_MS + 4 * 60_000;
      const restoredLate = createPublicVehicleIds();
      restoredLate.restore(await readPublicVehicleIds(path), late);
      expect(restoredLate.publish(answer(fleet), late).vehicles.map(vehicle => vehicle.vehicle_id))
        .toEqual([named[0], named[1], expect.not.stringMatching(named[2]!)]);
      // A scooter that moved over the restart, as any other.
      expect(after.publish(answer([scooter('lime:80', 47.3869)]), start + 4 * 60_000).vehicles[0].vehicle_id).not.toBe(named[0]);
    }));

    it('writes an id to a line, reads none past its time or unreadable, and refuses a file cut short', () => withFile(async path => {
      const ids = createPublicVehicleIds();
      await writePublicVehicleIds(path, ids.saved(), start);
      expect(await readPublicVehicleIds(path)).toEqual([]);
      ids.publish(answer([scooter('a'), scooter('b', 47.38)]), start);
      await writePublicVehicleIds(path, ids.saved(), start);
      const text = await readFile(path, 'utf8');
      expect(text.split('\n')).toHaveLength(5);
      expect(JSON.parse(text).ids).toEqual([...ids.saved()]);
      await writeFile(path, text.replace('"bolt:b"', '7'));
      expect((await readPublicVehicleIds(path)).map(([key]) => key)).toEqual(['bolt:a']);
      await writeFile(path, text.slice(0, -4));
      await expect(readPublicVehicleIds(path)).rejects.toThrow('cut short');
      // At most so many, the latest out of the answers kept; none a day out of them.
      const restored = createPublicVehicleIds({ maxKept: 1 });
      restored.restore(JSON.parse(text).ids, start + PUBLIC_ID_KEPT_MS);
      expect([...restored.saved()].map(([key]) => key)).toEqual(['bolt:b']);
      const expired = createPublicVehicleIds();
      expired.restore(JSON.parse(text).ids, start + PUBLIC_ID_KEPT_MS + 1);
      expect(expired.size()).toBe(0);
    }));

    it('writes each id once, where it stood, while answers come in as it writes', () => withFile(async path => {
      const ids = createPublicVehicleIds();
      ids.publish(answer(['a', 'b', 'c'].map(id => scooter(id))), start);
      const saved = ids.saved();
      expect(saved.next().value?.[0]).toBe('bolt:a');
      ids.publish(answer([scooter('a'), scooter('d')]), start + 1000);
      expect([...saved].map(([key]) => key)).toEqual(['bolt:b', 'bolt:c']);
      await writePublicVehicleIds(path, ids.saved(), start + 1000);
      expect((await readPublicVehicleIds(path)).map(([key]) => key)).toEqual(['bolt:b', 'bolt:c', 'bolt:a', 'bolt:d']);
    }));
  });
});
