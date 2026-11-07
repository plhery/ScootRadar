import { boundsCenter, boundsContainPoint, haversineM, polygonContainsPoint } from '../src/lib/geo';
import { regionalSource, serviceAreas, type RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { SLOW_COLLECTION_MS, VEHICLE_MAX_AGE_MS, viewReadsOf, type FeedSnapshot, type ListedArea } from '../src/lib/scooterSnapshots';
import type { MapBounds } from '../src/lib/types';
import { rydeVehicles, type RydeArea } from './rydeApp';
import type { RydeBroker, RydeQuery, RydeResult } from './rydeBridge';

const REFRESH_MS = 60_000;
const MAX_PENDING = 8;
const MAX_ENTRIES = 128;
const MAX_CITIES = 2;
interface Entry {
  area: RydeArea; query: RydeQuery; usedAt: number; retryAt: number; pending: boolean; failed: boolean;
  result?: RydeResult;
}
export interface WatchedRydeViews { observations: FeedSnapshot[]; refreshing: Set<string>; listed: ListedArea[] }

/**
 * One native read of the visible area, independent of the scheduler's long, exhaustive group scans.
 * These are positive observations: never a completed sweep or city totals. The one absence they claim
 * is within the circle of a read short of its area's saturation count, which the scans take as listing
 * every scooter there (scanRydeArea): the city's older positions there are gone.
 */
export class RydeWatchedViews {
  private readonly entries = new Map<string, Entry>();
  private readonly areaOfFeed = new Map<string, RydeArea>();
  /** Each area's feeds and their reads of the view, which a read listing a circle speaks for. */
  private readonly feedsOfArea = new Map<string, Set<string>>();
  private readonly publicBounds = new Map<string, MapBounds[]>();
  private readonly counts = { requested: 0, completed: 0, failed: 0 };
  constructor(private readonly broker: Pick<RydeBroker, 'query'> & Partial<Pick<RydeBroker, 'silentSince'>>, areas: readonly RydeArea[], enabled: string,
    systems: readonly RegionalScooterSystem[], private readonly clock = Date.now) {
    const selected = new Set(enabled.split(','));
    const byArea = new Map(areas.filter(area => selected.has('*') || selected.has(area.id)).map(area => [area.id, area]));
    for (const system of systems) {
      const area = byArea.get(system.rydeAppArea ?? '');
      const id = `${regionalSource(system)}:${system.id}`;
      if (area) {
        this.areaOfFeed.set(id, area);
        const feeds = this.feedsOfArea.get(area.id) ?? new Set<string>();
        feeds.add(id).add(viewReadsOf(id));
        this.feedsOfArea.set(area.id, feeds);
      }
      if (system.provider === 'ryde' && !system.rydeAppArea) {
        const bounds = this.publicBounds.get(system.country) ?? [];
        bounds.push(...serviceAreas(system).map(area => area.bounds));
        this.publicBounds.set(system.country, bounds);
      }
    }
  }
  handles(feed: { id: string }): boolean { return this.areaOfFeed.has(feed.id); }

  read(feeds: readonly FeedSnapshot[], bounds: MapBounds, demand: boolean, now = this.clock()): WatchedRydeViews {
    for (const [key, entry] of this.entries) {
      if (!entry.pending && now - entry.usedAt > VEHICLE_MAX_AGE_MS) this.entries.delete(key);
    }
    const [lat, lng] = boundsCenter(bounds);
    const candidates = new Map<string, { area: RydeArea; feed: FeedSnapshot; distance: number }>();
    for (const feed of feeds) {
      const area = this.areaOfFeed.get(feed.id);
      if (!area) continue;
      const distance = Math.min(...feed.coverage.map(part => haversineM(lat, lng,
        Math.max(part.south, Math.min(part.north, lat)), Math.max(part.west, Math.min(part.east, lng)))));
      if (distance < (candidates.get(area.id)?.distance ?? Infinity)) candidates.set(area.id, { area, feed, distance });
    }
    const observations: FeedSnapshot[] = [], refreshing = new Set<string>(), listed: ListedArea[] = [];
    // With no worker asking for jobs, a read queued waits for a deadline, not for an answer: it is not said
    // to be on its way, and the map stops asking every few seconds for it.
    const silent = this.broker.silentSince?.(now) !== undefined;
    for (const { area, feed } of [...candidates.values()].sort((a, b) => a.distance - b.distance).slice(0, MAX_CITIES)) {
      // A shared 100 m-ish grid coalesces nearby map requests. Include rounding in the radius;
      // a broad view is sampled at its centre, at most 5 km, and remains explicitly incomplete.
      const nearest = feed.coverage.reduce((a, b) => haversineM(lat, lng,
        Math.max(a.south, Math.min(a.north, lat)), Math.max(a.west, Math.min(a.east, lng))) <= haversineM(lat, lng,
        Math.max(b.south, Math.min(b.north, lat)), Math.max(b.west, Math.min(b.east, lng))) ? a : b);
      const latitude = Math.round(Math.max(nearest.south, Math.min(nearest.north, lat)) * 1000) / 1000;
      const longitude = Math.round(Math.max(nearest.west, Math.min(nearest.east, lng)) * 1000) / 1000;
      const radius = Math.min(5, Math.max(.25, Math.ceil(Math.max(...[bounds.south, bounds.north].flatMap(y =>
        [bounds.west, bounds.east].map(x => haversineM(latitude, longitude, y, x)))) / 250) * .25));
      const query = { cityId: area.cityId, latitude, longitude, radius };
      const key = JSON.stringify(query);
      let entry = this.entries.get(key);
      const pending = [...this.entries.values()].filter(entry => entry.pending);
      const blocked = pending.length >= MAX_PENDING || pending.some(entry => entry.area.id === area.id);
      if (demand && !entry && !blocked) {
        if (this.entries.size >= MAX_ENTRIES) {
          const oldest = [...this.entries].filter(([, e]) => !e.pending).sort((a, b) => a[1].usedAt - b[1].usedAt)[0];
          if (oldest) this.entries.delete(oldest[0]);
        }
        entry = { area, query, usedAt: now, retryAt: 0, pending: false, failed: false };
        this.entries.set(key, entry);
      }
      if (entry) entry.usedAt = now;
      if (demand && entry && !entry.pending && !blocked && now >= entry.retryAt &&
        (!entry.result || now - entry.result.observedAt * 1000 >= REFRESH_MS)) {
        const current = entry;
        current.pending = true;
        this.counts.requested++;
        void this.broker.query(query, true).then(result => {
          current.result = result; current.failed = false; this.counts.completed++;
        }, () => { current.failed = true; current.retryAt = this.clock() + REFRESH_MS; this.counts.failed++; })
          .finally(() => { current.pending = false; });
      }
      const id = viewReadsOf(feed.id);
      const waiting = demand && !silent && (entry?.pending || (!entry && blocked));
      if (waiting) refreshing.add(id);
      // Nearby views of this city may already have fresh observations. Keep their own times;
      // neither polling nor a new request makes an older response young again.
      const recent = [...this.entries.values()].filter(e => e.area.id === area.id && e.result &&
        now - e.result.observedAt * 1000 <= VEHICLE_MAX_AGE_MS).sort((a, b) => a.result!.observedAt - b.result!.observedAt);
      for (const cached of recent) {
        const result = cached.result!;
        const rows = result.scooters.filter(row => boundsContainPoint(area.bounds, row.lat, row.lng) &&
          area.rings.some(ring => polygonContainsPoint(ring, row.lat, row.lng)) &&
          !this.publicBounds.get(area.country)?.some(part => boundsContainPoint(part, row.lat, row.lng)));
        observations.push({ id, source: feed.source, provider: 'ryde', coverage: [bounds],
          vehicles: rydeVehicles({ observations: rows.map(row => ({ ...row, observedAt: result.observedAt * 1000 })),
            observedAt: result.observedAt * 1000, requests: 1, unfinished: 1, complete: false }),
          observedAt: result.observedAt * 1000, attemptedAt: result.observedAt * 1000,
          stale: true, failed: false, skipped: false, collectionMs: SLOW_COLLECTION_MS + 1 });
        // Within the circle the scans ask of a cell, which they trust to hold all it lists: a read of a
        // wider view may be answered for less than it asked.
        if ((result.returnedCount ?? result.scooters.length) < area.saturationCount) listed.push({
          feeds: this.feedsOfArea.get(area.id)!, at: result.observedAt * 1000, lat: cached.query.latitude,
          lng: cached.query.longitude, radiusM: Math.min(cached.query.radius * 1000, Math.SQRT2 * area.cellM / 2 * 1.1) });
      }
      if (!recent.length && (waiting || entry?.failed)) observations.push({ id, source: feed.source, provider: 'ryde',
        coverage: [bounds], vehicles: [], observedAt: 0, attemptedAt: entry?.failed ? now : 0,
        stale: true, failed: !!entry?.failed, skipped: false, collectionMs: SLOW_COLLECTION_MS + 1 });
    }
    return { observations, refreshing, listed };
  }
  metrics(): string {
    return Object.entries(this.counts).map(([outcome, count]) =>
      `scootradar_ryde_watched_views_total{outcome="${outcome}"} ${count}\n`).join('') +
      `scootradar_ryde_watched_views_pending ${[...this.entries.values()].filter(entry => entry.pending).length}\n`;
  }
}
