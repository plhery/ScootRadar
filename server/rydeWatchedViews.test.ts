import { describe, expect, it, vi } from 'vitest';
import { RydeWatchedViews } from './rydeWatchedViews';
import { RydeBroker, type RydeQuery, type RydeResult } from './rydeBridge';
import type { RydeArea } from './rydeApp';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import type { FeedSnapshot } from '../src/lib/scooterSnapshots';

const bounds = { south: 48.36, north: 48.37, west: 10.89, east: 10.90 };
const area: RydeArea = { id: 'de-test', cityId: 111, city: 'Test', country: 'DE', bounds,
  rings: [[[48.36, 10.89], [48.36, 10.90], [48.37, 10.90], [48.37, 10.89]]],
  geometryEvidence: 'fixture', coverageEvidence: 'fixture', coverageValidated: false,
  uptimeEvidence: '', uptimeValidated: false, saturationCount: 100, cellM: 1000 };
const system = { id: 'ryde_app_de_test_000', country: 'DE', provider: 'ryde', bounds,
  rydeAppArea: area.id } as RegionalScooterSystem;
const feed: FeedSnapshot = { id: `germany:${system.id}`, provider: 'ryde', source: 'germany', coverage: [bounds],
  vehicles: [], observedAt: 1, attemptedAt: 1, stale: false, failed: false, skipped: false };
const result = (query: RydeQuery, at: number, scooters = [{ id: 'a'.repeat(32), lat: 48.365, lng: 10.895 }]): RydeResult =>
  ({ version: 1, id: 'b'.repeat(32), query: { ...query, version: 1, id: 'b'.repeat(32), expiresAt: at / 1000 + 120 },
    observedAt: at / 1000, coverage: 'unknown', scooters });
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };

describe('watched Ryde native views', () => {
  it('takes one urgent viewport read and coalesces polling and viewers for a minute', async () => {
    let now = 1_000_000;
    const query = vi.fn<(q: RydeQuery, urgent?: boolean) => Promise<RydeResult>>(async q => result(q, now));
    const views = new RydeWatchedViews({ query }, [area], '*', [system], () => now);
    const pending = views.read([feed], bounds, true);
    expect(pending.refreshing.size).toBe(1);
    expect(pending.awaitingView.size).toBe(1);
    expect(pending.observations[0].observedAt).toBe(0);
    views.read([feed], bounds, true);
    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][1]).toBe(true);
    const q = query.mock.calls[0][0];
    expect(q.cityId).toBe(111); expect(q.latitude).toBe(48.365); expect(q.longitude).toBe(10.895);
    await settle();
    now += 59_000;
    const cached = views.read([feed], bounds, true);
    expect(query).toHaveBeenCalledTimes(1);
    expect(cached.refreshing.size).toBe(0);
    expect(cached.awaitingView.size).toBe(0);
    expect(cached.observations[0]).toMatchObject({ observedAt: 1_000_000, stale: true, failed: false });
    expect(cached.observations[0].sweep).toBeUndefined();
    now += 1000;
    const renewing = views.read([feed], bounds, true);
    expect(renewing.refreshing.size).toBe(1);
    expect(renewing.awaitingView.size).toBe(0);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('can reach a new city while old group scans occupy the scheduler slots', async () => {
    let now = 1_000_000;
    const broker = new RydeBroker('test-token-'.repeat(5), () => now);
    const background = broker.query({ cityId: 43, latitude: 59.74, longitude: 10.2, radius: 1 });
    const oldJob = broker.lease()!;
    const views = new RydeWatchedViews(broker, [area], '*', [system], () => now);
    views.read([feed], bounds, true);
    broker.accept({ ...result(oldJob, now, []), id: oldJob.id, query: oldJob });
    await background;
    now += 5_000;
    const viewed = broker.lease()!;
    expect(viewed.cityId).toBe(111);
    broker.accept({ ...result(viewed, now), id: viewed.id, query: viewed });
    await settle();
    expect(views.read([feed], bounds, false).observations[0].vehicles).toHaveLength(1);
    broker.close();
  });

  it('bounds panning to one pending read per city, then reads the new focus', async () => {
    let finish!: (value: RydeResult) => void;
    const query = vi.fn((q: RydeQuery) => new Promise<RydeResult>(resolve => { finish = resolve; void q; }));
    const views = new RydeWatchedViews({ query }, [area], '*', [system], () => 1_000_000);
    views.read([feed], bounds, true);
    const moved = { ...bounds, west: 10.892, east: 10.902 };
    expect(views.read([feed], moved, true).awaitingView.size).toBe(1);
    expect(query).toHaveBeenCalledTimes(1);
    finish(result(query.mock.calls[0][0], 1_000_000)); await settle();
    const moving = views.read([feed], moved, true);
    expect(moving.awaitingView.size).toBe(1);
    expect(moving.observations[0].observedAt).toBe(1_000_000);
    expect(query).toHaveBeenCalledTimes(2);
  });

  it('does not wake disabled markets or when visitor demand is withheld', () => {
    const query = vi.fn();
    const views = new RydeWatchedViews({ query }, [area], 'another-area', [system]);
    expect(views.handles(feed)).toBe(false);
    expect(views.read([feed], bounds, true).observations).toEqual([]);
    const enabled = new RydeWatchedViews({ query }, [area], '*', [system]);
    enabled.read([feed], bounds, false);
    expect(query).not.toHaveBeenCalled();
  });

  it('bounds simultaneous city switches to eight native reads and two cities per answer', () => {
    const areas = Array.from({ length: 10 }, (_, i) => ({ ...area, id: `test-${i}`, cityId: i + 1 }));
    const systems = areas.map(a => ({ ...system, id: `ryde_app_test_${a.cityId}`, rydeAppArea: a.id }));
    const feeds = systems.map(s => ({ ...feed, id: `germany:${s.id}` }));
    const query = vi.fn(() => new Promise<RydeResult>(() => {}));
    const views = new RydeWatchedViews({ query }, areas, '*', systems, () => 1_000_000);
    views.read(feeds, bounds, true);
    expect(query).toHaveBeenCalledTimes(2);
    for (const feed of feeds) views.read([feed], bounds, true);
    expect(query).toHaveBeenCalledTimes(8);
    expect(views.read([feeds[9]], bounds, true).refreshing.size).toBe(1);
  });

  it('filters observations outside the operating geometry and existing public-feed coverage', async () => {
    const query = vi.fn(async (q: RydeQuery) => result(q, 1_000_000, [
      { id: 'inside', lat: 48.365, lng: 10.895 },
      { id: 'outside', lat: 48.375, lng: 10.895 },
      { id: 'public', lat: 48.361, lng: 10.891 },
    ]));
    const publicFeed = { ...system, id: 'ryde_de_public', rydeAppArea: undefined,
      bounds: { south: 48.360, north: 48.362, west: 10.890, east: 10.892 } };
    const views = new RydeWatchedViews({ query }, [area], '*', [system, publicFeed], () => 1_000_000);
    views.read([feed], bounds, true); await settle();
    expect(views.read([feed], bounds, false).observations[0].vehicles.map(v => v.vehicle_id)).toEqual(['ryde-app:inside']);
  });

  it('lists the circle of a read short of the saturation count, where older positions of the city are gone', async () => {
    const now = 1_000_000;
    const other = { ...system, id: 'ryde_app_de_test_001' };
    const query = vi.fn(async (q: RydeQuery) => result(q, now));
    const views = new RydeWatchedViews({ query }, [area], '*', [system, other], () => now);
    views.read([feed], bounds, true); await settle();
    const [circle] = views.read([feed], bounds, false).listed;
    expect(circle).toMatchObject({ at: now, lat: 48.365, lng: 10.895, radiusM: 750 });
    // No wider than the circle a scan asks of one of the area's cells.
    const wide = { south: 48.33, north: 48.40, west: 10.85, east: 10.94 };
    const far = new RydeWatchedViews({ query }, [{ ...area, bounds: wide }], '*', [system], () => now);
    far.read([{ ...feed, coverage: [wide] }], wide, true); await settle();
    expect(far.read([{ ...feed, coverage: [wide] }], wide, false).listed[0].radiusM).toBeCloseTo(Math.SQRT2 * 1000 / 2 * 1.1);
    expect([...circle.feeds].sort()).toEqual([feed.id, `${feed.id}_view`, `germany:${other.id}`, `germany:${other.id}_view`].sort());
    // As many as the saturation count may be a part of them: a read that full lists nothing.
    const full = vi.fn(async (q: RydeQuery) => ({ ...result(q, now), returnedCount: area.saturationCount }));
    const saturated = new RydeWatchedViews({ query: full }, [area], '*', [system], () => now);
    saturated.read([feed], bounds, true); await settle();
    const answer = saturated.read([feed], bounds, false);
    expect(answer.observations).toHaveLength(1);
    expect(answer.listed).toEqual([]);
  });

  it('does not say a read is on its way while no worker asks for jobs', () => {
    let silent: number | undefined = 1;
    const query = vi.fn(() => new Promise<RydeResult>(() => {}));
    const views = new RydeWatchedViews({ query, silentSince: () => silent }, [area], '*', [system], () => 1_000_000);
    expect(views.read([feed], bounds, true).refreshing.size).toBe(0);
    expect(views.read([feed], bounds, true).awaitingView.size).toBe(0);
    silent = undefined;
    expect(views.read([feed], bounds, true).refreshing.size).toBe(1);
  });

  it('backs off a failed focused read without ageing or changing a previous observation', async () => {
    let now = 1_000_000;
    const query = vi.fn(async (q: RydeQuery) => result(q, now));
    const views = new RydeWatchedViews({ query }, [area], '*', [system], () => now);
    views.read([feed], bounds, true); await settle();
    now += 60_000; query.mockRejectedValueOnce(new Error('unavailable'));
    views.read([feed], bounds, true); await settle();
    const held = views.read([feed], bounds, true);
    expect(query).toHaveBeenCalledTimes(2);
    expect(held.observations[0].observedAt).toBe(1_000_000);
    expect(held.refreshing.size).toBe(0);
    now += 60_000; views.read([feed], bounds, true);
    expect(query).toHaveBeenCalledTimes(3);
    await settle();
    now += 16 * 60_000;
    expect(views.read([feed], bounds, false).observations).toEqual([]);
  });
});
