import { describe, expect, it, vi } from 'vitest';
import { COUNTRY_SOURCES } from '../src/generated/countries';
import { haversineM } from '../src/lib/geo';
import { REGIONAL_SCOOTER_SYSTEMS, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { independentCollectableFeeds, type SourceVehicles } from '../src/lib/scooterFeeds';
import type { Vehicle } from '../src/lib/types';
import { BIRD_PAGE, type BirdScooter } from './birdApp';
import { BirdSupplement, SUPPLEMENT_IDLE_MS, SUPPLEMENT_MAX_AGE_MS, SUPPLEMENT_WATCHED_MS, withBirdSupplements } from './birdSupplement';
import { reportError } from './errorReporting';
import type { Ring } from './nearestSweep';
import { withinCollection } from './sweeps';

vi.mock('./errorReporting', () => ({ reportError: vi.fn() }));

const ROME = REGIONAL_SCOOTER_SYSTEMS.find(system => system.id === 'bird_it_rome')!;
const system = { ...ROME, provider: 'bird' as const, timeZone: 'Europe/Rome' };
// A square of about 830 by 1,110 m by the Vatican.
const AREA: Ring = [[41.900, 12.445], [41.910, 12.445], [41.910, 12.455], [41.900, 12.455]];
// Noon in Rome, a Monday.
const NOON = Date.UTC(2026, 10, 9, 11, 0);
const MINUTE = 60_000;
let serial = 0;
const scooter = (lat: number, lng: number, brand: 'bird' | 'spin' = 'bird'): BirdScooter =>
  ({ id: `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}`, brand, lat, lng, battery: 60, range: 20_000 });
/** The feed's scooter a few metres north of a spot. */
const listed = (lat: number, lng: number, metres = 5): Vehicle => ({ provider: 'bird', vehicle_id: `gbfs-${++serial}`,
  lat: lat + metres / 111_320, lng, battery: 80, range_m: 30_000, deep_link: null, distance_m: null });
/** Bird's map: the nearest scooters to a point, at most a page, as the client returns them. */
function map(scooters: () => readonly BirdScooter[]) {
  return { nearest: vi.fn(async (lat: number, lng: number, radiusM = 5_000) => {
    const near = scooters().filter(entry => haversineM(lat, lng, entry.lat, entry.lng) <= radiusM)
      .sort((a, b) => haversineM(lat, lng, a.lat, a.lng) - haversineM(lat, lng, b.lat, b.lng)).slice(0, BIRD_PAGE);
    return { scooters: near, completeM: radiusM };
  }) };
}
const feed = (vehicles: Vehicle[], stale = false) => async (): Promise<SourceVehicles> => ({ observedAt: NOON, stale, vehicles });
const watched = <T>(run: () => Promise<T>) => withinCollection({ urgent: () => true, focus: () => undefined, progress: () => undefined }, run);
const ids = (result: SourceVehicles) => result.vehicles.map(vehicle => vehicle.vehicle_id);

function setUp(scooters: BirdScooter[]) {
  let now = NOON;
  const api = map(() => scooters);
  const supplement = new BirdSupplement(system as RegionalScooterSystem & typeof system, [AREA], api, () => now);
  return { api, supplement, at: (time: number) => { now = time; } };
}

describe('Bird map scooters a public feed leaves out', () => {
  it('adds those its map shows and the feed does not list, one for each the feed leaves out where several stand together', async () => {
    const own = scooter(41.903, 12.448), left = scooter(41.905, 12.450);
    const pair = [scooter(41.907, 12.452), scooter(41.907, 12.452)];
    const beyond = scooter(41.912, 12.450), spin = scooter(41.904, 12.447, 'spin');
    const { supplement } = setUp([own, left, ...pair, beyond, spin]);
    const listing = [listed(own.lat, own.lng), listed(pair[0].lat, pair[0].lng, 3)];
    // The first collection starts the sweep and has none of its scooters.
    expect(ids(await supplement.collect(feed(listing)))).toEqual(listing.map(vehicle => vehicle.vehicle_id));
    await supplement.settled();
    const result = await supplement.collect(feed(listing));
    expect(result.vehicles.slice(0, 2)).toEqual(listing);
    expect(result.vehicles.slice(2)).toEqual([
      { provider: 'bird', vehicle_id: `bird:${left.id}`, lat: left.lat, lng: left.lng, battery: 60, range_m: 20_000, deep_link: null, distance_m: null },
      expect.objectContaining({ vehicle_id: `bird:${pair[1].id}` }),
    ]);
  });

  it('leaves out a scooter the feed listed once ridden away, and one the feed lists on its spot for as long as it does', async () => {
    const own = scooter(41.903, 12.448), left = scooter(41.905, 12.450);
    const { supplement } = setUp([own, left]);
    await supplement.collect(feed([listed(own.lat, own.lng)]));
    await supplement.settled();
    // A stale feed cannot tell which it leaves out.
    expect(ids(await supplement.collect(feed([listed(own.lat, own.lng)], true)))).toHaveLength(1);
    expect(ids(await supplement.collect(feed([listed(own.lat, own.lng)])))).toContain(`bird:${left.id}`);
    // Ridden away, the feed's scooter stands elsewhere: the map's old spot is not added.
    const away = listed(41.909, 12.454);
    expect(ids(await supplement.collect(feed([away])))).toEqual([away.vehicle_id, `bird:${left.id}`]);
    const onLeft = listed(left.lat, left.lng);
    expect(ids(await supplement.collect(feed([away, onLeft])))).toEqual([away.vehicle_id, onLeft.vehicle_id]);
    expect(ids(await supplement.collect(feed([away])))).toEqual([away.vehicle_id, `bird:${left.id}`]);
  });

  it('sweeps every two hours by day while nobody looks, every half hour while someone does, one sweep at a time', async () => {
    const left = scooter(41.905, 12.450);
    const { api, supplement, at } = setUp([left]);
    const sweeps = () => api.nearest.mock.calls.length;
    await supplement.collect(feed([]));
    await supplement.settled();
    const one = sweeps();
    expect(one).toBeGreaterThan(0);
    at(NOON + SUPPLEMENT_IDLE_MS - MINUTE);
    await supplement.collect(feed([]));
    expect(sweeps()).toBe(one);
    at(NOON + SUPPLEMENT_IDLE_MS);
    await supplement.collect(feed([]));
    await supplement.settled();
    expect(sweeps()).toBe(2 * one);
    const second = NOON + SUPPLEMENT_IDLE_MS;
    at(second + SUPPLEMENT_WATCHED_MS - MINUTE);
    await watched(() => supplement.collect(feed([])));
    expect(sweeps()).toBe(2 * one);
    // A sweep under way is not started again.
    let release!: () => void;
    api.nearest.mockImplementationOnce(async () => { await new Promise<void>(resolve => { release = resolve; }); return { scooters: [left], completeM: 5_000 }; });
    at(second + SUPPLEMENT_WATCHED_MS);
    await watched(() => supplement.collect(feed([])));
    at(second + 2 * SUPPLEMENT_WATCHED_MS);
    await watched(() => supplement.collect(feed([])));
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    release();
    await supplement.settled();
    expect(sweeps()).toBe(3 * one);
    // 21:30 in Rome: none while nobody looks; the last sweep's additions are too old by then.
    const evening = Date.UTC(2026, 10, 9, 20, 30);
    at(evening);
    expect(ids(await supplement.collect(feed([])))).toEqual([]);
    expect(sweeps()).toBe(3 * one);
    // Someone looks: swept by night too, whose additions stand until too old.
    await watched(() => supplement.collect(feed([])));
    await supplement.settled();
    expect(sweeps()).toBe(4 * one);
    at(evening + SUPPLEMENT_MAX_AGE_MS);
    expect(ids(await supplement.collect(feed([])))).toEqual([`bird:${left.id}`]);
    at(evening + SUPPLEMENT_MAX_AGE_MS + MINUTE);
    expect(ids(await supplement.collect(feed([])))).toEqual([]);
    expect(sweeps()).toBe(4 * one);
  });

  it('leaves the feed as it is while the map cannot be read, and tells Sentry once two sweeps in a row have failed', async () => {
    const { api, supplement, at } = setUp([scooter(41.905, 12.450)]);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    api.nearest.mockRejectedValue(new Error('Bird requests are held off'));
    const own = listed(41.903, 12.448);
    expect(ids(await supplement.collect(feed([own])))).toEqual([own.vehicle_id]);
    await supplement.settled();
    expect(reportError).not.toHaveBeenCalled();
    at(NOON + SUPPLEMENT_WATCHED_MS);
    expect(ids(await watched(() => supplement.collect(feed([own]))))).toEqual([own.vehicle_id]);
    await supplement.settled();
    expect(reportError).toHaveBeenCalledWith('bird-supplement:bird_it_rome', expect.any(Error));
  });

  it("adds to Rome's public feed only, with one supplement however often the cache rebuilds its feeds", () => {
    const feeds = independentCollectableFeeds();
    const kept = new Map<string, BirdSupplement>();
    const api = map(() => []);
    const wrapped = withBirdSupplements(feeds, REGIONAL_SCOOTER_SYSTEMS, api, kept);
    expect(wrapped.filter((entry, index) => entry !== feeds[index]).map(entry => entry.id)).toEqual([`${COUNTRY_SOURCES.IT}:bird_it_rome`]);
    const supplement = kept.get(`${COUNTRY_SOURCES.IT}:bird_it_rome`);
    withBirdSupplements(independentCollectableFeeds(), REGIONAL_SCOOTER_SYSTEMS, api, kept);
    expect(kept.size).toBe(1);
    expect(kept.get(`${COUNTRY_SOURCES.IT}:bird_it_rome`)).toBe(supplement);
    expect(ROME).toMatchObject({ provider: 'bird', timeZone: 'Europe/Rome', birdAppSupplement: '8c1c167f-8584-43eb-a2f8-f23258e352e4' });
  });
});
