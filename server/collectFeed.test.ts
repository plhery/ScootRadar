import { expect, it } from 'vitest';
import { collectSnapshotFeed, smoothedCollectionMs } from './collectFeed';
import { buildCityOverview, querySnapshot, type FeedSnapshot } from '../src/lib/scooterSnapshots';
import type { ParkingSnapshot } from '../src/lib/parking';

it('publishes fresh status despite stale metadata before optional parking completes', async () => {
  const now = Date.now();
  const bounds = { south: 47.3, west: 8.4, north: 47.5, east: 8.7 };
  const vehicle = { provider: 'lime', vehicle_id: 'live', lat: 47.377, lng: 8.542,
    battery: 80, range_m: null, distance_m: null, deep_link: null };
  const definition = { id: 'national:lime_zurich', provider: 'lime' as const, source: 'national' as const,
    host: 'test', coverage: [bounds], collect: async () => ({ vehicles: [vehicle], observedAt: now, stale: true }) };
  const old: FeedSnapshot = { ...definition, vehicles: [], observedAt: now - 360_000, attemptedAt: now - 360_000,
    failed: false, skipped: false, stale: false };
  let finishParking!: (result: ParkingSnapshot) => void;
  const published: FeedSnapshot[] = [];
  const pending = collectSnapshotFeed(definition, old, record => published.push(record),
    () => new Promise(resolve => { finishParking = resolve; }));
  await Promise.resolve();
  expect(published).toHaveLength(1);
  expect(published[0].observedAt).toBe(now);
  const response = querySnapshot({ version: 1, updatedAt: now, feeds: published, overview: buildCityOverview(published, now) },
    { bounds, minBattery: 0 }, 16, now);
  expect(response.vehicles).toEqual([vehicle]);
  expect(response.meta.stale).toBe(true);
  finishParking({ locations: [], observedAt: now, stale: false });
  await pending;
  expect(published).toHaveLength(2);
});

it('collects no parking for a skipped feed and drops the parking it had', async () => {
  const now = Date.now();
  const bounds = { south: 45.4, west: 6.9, north: 45.5, east: 7.0 };
  const definition = { id: 'france:dott_fr_tignes', provider: 'dott' as const, source: 'france' as const,
    host: 'test', coverage: [bounds], collect: async () => ({ vehicles: [], stale: false, skipped: true }) };
  const old: FeedSnapshot = { ...definition, vehicles: [], observedAt: now - 60_000, attemptedAt: now - 60_000,
    failed: false, skipped: false, stale: false, parking: { locations: [], observedAt: now - 60_000, stale: false } };
  let parkingRequests = 0;
  const published: FeedSnapshot[] = [];
  await collectSnapshotFeed(definition, old, record => published.push(record), async () => {
    parkingRequests++;
    return { locations: [], observedAt: now, stale: false };
  });
  expect(parkingRequests).toBe(0);
  expect(published).toHaveLength(1);
  expect(published[0]).toMatchObject({ skipped: true, parking: undefined });
});

it('keeps a region closed for the season closed through a failed collection', async () => {
  const now = Date.now();
  const bounds = { south: 51.0, west: 71.2, north: 51.3, east: 71.7 };
  const definition = { id: 'kazakhstan:whoosh_kz_nqz', provider: 'whoosh' as const, source: 'kazakhstan' as const,
    host: 'test', coverage: [bounds], collect: async () => ({ vehicles: [], observedAt: now, stale: false, seasonOver: true }) };
  const published: FeedSnapshot[] = [];
  await collectSnapshotFeed(definition, undefined, record => published.push(record));
  expect(published[0]).toMatchObject({ failed: false, seasonOver: true });
  await collectSnapshotFeed({ ...definition, collect: async () => { throw new Error('Whoosh map HTTP 502'); } },
    published[0], record => published.push(record));
  expect(published[1]).toMatchObject({ failed: true, seasonOver: true });
  await collectSnapshotFeed({ ...definition, collect: async () => ({ vehicles: [], observedAt: now, stale: false }) },
    published[1], record => published.push(record));
  expect(published[2].seasonOver).toBeUndefined();
});

it('times its collections, smoothed, and keeps the time through a failure', async () => {
  expect(smoothedCollectionMs(undefined, 900)).toBe(900);
  expect(smoothedCollectionMs(900, 30_000)).toBe(10_600);
  const definition = { id: 'national:lime_zurich', provider: 'lime' as const, source: 'national' as const, host: 'test', coverage: [],
    collect: async () => { await new Promise(resolve => setTimeout(resolve, 60)); return { vehicles: [], observedAt: Date.now(), stale: false }; } };
  const published: FeedSnapshot[] = [];
  await collectSnapshotFeed(definition, undefined, record => published.push(record));
  expect(published[0].collectionMs).toBeGreaterThanOrEqual(55);
  await collectSnapshotFeed({ ...definition, collect: async () => { throw new Error('down'); } }, { ...published[0], collectionMs: 4_000 },
    record => published.push(record));
  expect(published[1]).toMatchObject({ failed: true, collectionMs: 4_000 });
});
