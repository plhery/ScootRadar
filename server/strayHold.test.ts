import { expect, it } from 'vitest';
import { createStrayHold, STRAY_HOLD_MS } from './strayHold';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';

const bounds = { south: 50.2, west: 30.2, north: 50.6, east: 30.9 };
const scooter = (id: string, lat: number, lng: number) => ({ provider: 'zelectra', vehicle_id: `zelectra_ua_kyiv:${id}`,
  lat, lng, battery: null, range_m: 11500, distance_m: null, deep_link: null });
const record = (vehicles: ReturnType<typeof scooter>[], collectedAt: number): FeedSnapshot => ({ id: 'ukraine:zelectra_ua_kyiv',
  source: 'ukraine', provider: 'zelectra', coverage: [bounds], vehicles, observedAt: collectedAt, attemptedAt: collectedAt,
  collectedAt, stale: false, failed: false, skipped: false });

const MINUTE = 60_000;
const watched = () => MINUTE;
const idle = () => 20 * MINUTE;

it('keeps a scooter the feed puts in Lima at its last place in Kyiv for ten minutes, then drops it', () => {
  const hold = createStrayHold(watched);
  const start = Date.now();
  const kyiv = scooter('one', 50.4447, 30.4991);
  const stays = scooter('two', 50.45, 30.52);
  let old = record([kyiv, stays], start);
  const counts: number[] = [];
  for (let minute = 1; minute <= 12; minute++) {
    const now = start + minute * 60_000;
    const collected = hold(old.id, { vehicles: [stays], stale: false, strayIds: [kyiv.vehicle_id] }, old, now);
    counts.push(collected.vehicles.length);
    if (collected.vehicles.length === 2) expect(collected.vehicles[1]).toEqual(kyiv);
    old = record(collected.vehicles, now);
  }
  expect(counts).toEqual([2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1]);
  expect(STRAY_HOLD_MS).toBe(600_000);
});

it('holds a scooter until the next collection when nobody looks and the feed is collected every 20 minutes', () => {
  const hold = createStrayHold(idle);
  const start = Date.now();
  const kyiv = scooter('one', 50.4447, 30.4991);
  let old = record([kyiv], start);
  const counts: number[] = [];
  // A collection takes a few seconds, more one time than the next.
  for (const at of [20 * MINUTE + 5_000, 40 * MINUTE + 1_000, 60 * MINUTE]) {
    const now = start + at;
    const collected = hold(old.id, { vehicles: [], stale: false, strayIds: [kyiv.vehicle_id] }, old, now);
    counts.push(collected.vehicles.length);
    old = record(collected.vehicles, now);
  }
  expect(counts).toEqual([1, 0, 0]);
});

it('still holds a scooter found far away by an idle collection when someone opens the map ten minutes later', () => {
  const start = Date.now();
  // Collected every 20 minutes, then every minute from minute 32, when someone opens the map.
  const hold = createStrayHold((_id, now) => now < start + 32 * MINUTE ? 20 * MINUTE : MINUTE);
  const kyiv = scooter('one', 50.4447, 30.4991);
  let old = record([kyiv], start);
  const counts: number[] = [];
  for (const minutes of [20, 32, 33, 38, 39, 40]) {
    const now = start + minutes * MINUTE;
    const collected = hold(old.id, { vehicles: [], stale: false, strayIds: [kyiv.vehicle_id] }, old, now);
    counts.push(collected.vehicles.length);
    old = record(collected.vehicles, now);
  }
  expect(counts).toEqual([1, 1, 1, 1, 0, 0]);
});

it('holds only the scooters put far away, not those ridden off or back in town', () => {
  const hold = createStrayHold(watched);
  const now = Date.now();
  const lima = scooter('lima', 50.4447, 30.4991);
  const rented = scooter('rented', 50.46, 30.51);
  const back = scooter('back', 50.47, 30.53);
  const old = record([lima, rented, back], now - 60_000);
  const collected = hold(old.id, { vehicles: [back], stale: false,
    strayIds: [lima.vehicle_id, back.vehicle_id, 'zelectra_ua_kyiv:never-in-kyiv'] }, old, now);
  expect(collected.vehicles).toEqual([back, lima]);
});

it('holds nothing for a skipped feed, or from the old scooters a failed feed keeps', () => {
  const hold = createStrayHold(watched);
  const now = Date.now();
  const lima = scooter('lima', 50.4447, 30.4991);
  const strayed = { vehicles: [], stale: false, strayIds: [lima.vehicle_id] };
  expect(hold('ukraine:zelectra_ua_kyiv', { ...strayed, skipped: true }, record([lima], now - 60_000), now).vehicles).toEqual([]);
  // A feed failing for half an hour keeps its last scooters, which are too old to hold once it is back.
  const failed = { ...record([lima], now - 30 * 60_000), attemptedAt: now - 60_000, failed: true };
  expect(hold('ukraine:zelectra_ua_kyiv', strayed, failed, now).vehicles).toEqual([]);
  expect(hold('ukraine:zelectra_ua_kyiv', strayed, undefined, now).vehicles).toEqual([]);
});

it("holds nothing for a feed whose data may be kept only 15 minutes, as Bird's", () => {
  const hold = createStrayHold(watched, STRAY_HOLD_MS, id => id !== 'ukraine:zelectra_ua_kyiv');
  const now = Date.now();
  const lima = scooter('lima', 50.4447, 30.4991);
  const strayed = { vehicles: [], stale: false, strayIds: [lima.vehicle_id] };
  expect(hold('ukraine:zelectra_ua_kyiv', strayed, record([lima], now - 60_000), now).vehicles).toEqual([]);
});
