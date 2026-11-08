import { boundsContainPoint, pairWithin, polygonContainsPoint } from '../src/lib/geo';
import type { RegionalScooterSystem } from '../src/lib/regionalScooterSystems';
import { localClock } from '../src/lib/rentalCurfews';
import type { CollectableScooterFeed, SourceVehicles } from '../src/lib/scooterFeeds';
import type { Vehicle } from '../src/lib/types';
import { BIRD_QUERY_INTERVAL_MS, birdAreaRings, birdMapClient, birdVehicle, sweepBirdArea, type BirdClient, type BirdScooter } from './birdApp';
import { reportError } from './errorReporting';
import type { Ring } from './nearestSweep';
import { currentCollection } from './sweeps';

/*
 * Bird's public feed for Rome leaves out a quarter of the scooters its rider map shows west of the
 * Tiber and in the centre, ridden ones among them, and not the same ones from one read to the next:
 * 269 of the 1,057 in Bird's west area at 22:00 UTC on 8 November 2026, and of the scooters by the
 * Vatican that stood still from 11:25 to 20:56 UTC that day, 18 the feed had listed were left out
 * at the end (docs/bird-app-map.md). The feed's scooters stand, collected as before. A sweep of
 * Bird's operating area there adds the scooters its map listed and the feed did not, for as long as
 * none of the feed's stands on one.
 */

/** How often an area nobody looks at is swept, by day in its town: an addition ridden away stands until the next. */
export const SUPPLEMENT_IDLE_MS = 2 * 60 * 60_000;
/** How often while someone looks at it: Rome's west area took 18 requests, nine minutes of Bird's one every 30 seconds. */
export const SUPPLEMENT_WATCHED_MS = 30 * 60_000;
/** How long a sweep's additions stand: past the next idle sweep's end, then none should it fail. */
export const SUPPLEMENT_MAX_AGE_MS = SUPPLEMENT_IDLE_MS + 30 * 60_000;
/** A scooter of the map is the feed's when one of the feed's stands within this of it, one each: the research reader's 40 m. */
export const SUPPLEMENT_MATCH_M = 40;
const SUPPLEMENT_LIMITS = { requests: 60, milliseconds: 60 * 60_000, retryMs: BIRD_QUERY_INTERVAL_MS };
// Idle sweeps fall between 08:00 and 21:00 in the town, as an app area's (daytimeSweeps).
const DAY_FROM = 8 * 60;
const DAY_UNTIL = 21 * 60;

/** One public feed's additions from Bird's map, kept across the cache's rebuilt feed definitions. */
export class BirdSupplement {
  private sweeping?: Promise<void>;
  private startedAt = -Infinity;
  private sweptAt?: number;
  /** The last sweep's scooters of the feed's brand, inside the area and the feed's bounds. */
  private scooters: BirdScooter[] = [];
  /** Those of them the feed did not list once the sweep had ended, from its first fresh collection after. */
  private added?: Set<string>;
  private failures = 0;

  constructor(private readonly system: RegionalScooterSystem & { provider: 'bird' | 'spin'; timeZone: string },
    private readonly rings: readonly Ring[], private readonly api: Pick<BirdClient, 'nearest'>,
    private readonly now: () => number = Date.now) {}

  /** The feed's collection with the scooters it leaves out, and a sweep started when one is due. */
  async collect(feed: () => Promise<SourceVehicles>): Promise<SourceVehicles> {
    const result = await feed();
    const now = this.now();
    // In the feed's collection, so that the sweep's requests go first while someone looks (Pacer).
    if (this.due(now, currentCollection()?.urgent() ?? false)) {
      this.sweeping = this.sweep(now).finally(() => { this.sweeping = undefined; });
    }
    const added = this.additions(result.vehicles, now, !result.stale);
    return added.length ? { ...result, vehicles: [...result.vehicles, ...added] } : result;
  }

  /** Once the sweep under way, if any, has ended. */
  async settled(): Promise<void> { await this.sweeping; }

  private due(now: number, urgent: boolean): boolean {
    if (this.sweeping) return false;
    if (urgent) return now - this.startedAt >= SUPPLEMENT_WATCHED_MS;
    const { minutes } = localClock(now, this.system.timeZone);
    return now - this.startedAt >= SUPPLEMENT_IDLE_MS && minutes >= DAY_FROM && minutes < DAY_UNTIL;
  }

  private additions(listed: readonly Vehicle[], now: number, fresh: boolean): Vehicle[] {
    if (this.sweptAt === undefined || now - this.sweptAt > SUPPLEMENT_MAX_AGE_MS) return [];
    const standing = pairWithin(this.scooters, listed.filter(vehicle => vehicle.provider === this.system.provider), SUPPLEMENT_MATCH_M);
    // Those the feed listed then are its own wherever they go: one ridden away is not left standing on the map's old spot.
    if (!this.added) {
      if (!fresh) return [];
      this.added = new Set(this.scooters.filter((_, index) => !standing.has(index)).map(scooter => scooter.id));
    }
    return this.scooters.filter((scooter, index) => this.added!.has(scooter.id) && !standing.has(index))
      .map(scooter => birdVehicle(this.system.provider, scooter));
  }

  /** Never fails: the feed's own scooters stand while Bird's map cannot be read. */
  private async sweep(now: number): Promise<void> {
    this.startedAt = now;
    try {
      const sweep = await sweepBirdArea(this.api, this.rings, this.scooters, SUPPLEMENT_LIMITS);
      this.scooters = sweep.scooters.filter(scooter => scooter.brand === this.system.provider &&
        boundsContainPoint(this.system.bounds, scooter.lat, scooter.lng) && this.rings.some(ring => polygonContainsPoint(ring, scooter.lat, scooter.lng)));
      this.sweptAt = now;
      this.added = undefined;
      this.failures = 0;
      console.log(JSON.stringify({ event: 'bird_supplement_sweep', system: this.system.id, scooters: this.scooters.length,
        requests: sweep.requests, seconds: Math.round((this.now() - now) / 1000) }));
    } catch (error) {
      this.failures++;
      console.warn(JSON.stringify({ event: 'bird_supplement_failed', system: this.system.id,
        error: (error instanceof Error ? error.message : String(error)).slice(0, 300) }));
      // The feed's own scooters stand meanwhile: Sentry hears once two sweeps in a row have failed.
      if (this.failures >= 2) reportError(`bird-supplement:${this.system.id}`, error);
    }
  }
}

const supplements = new Map<string, BirdSupplement>();

/** The public Bird feeds whose system names a birdAppSupplement, with the scooters they leave out. */
export function withBirdSupplements(feeds: CollectableScooterFeed[], systems: readonly RegionalScooterSystem[],
  api: Pick<BirdClient, 'nearest'> = birdMapClient, kept = supplements): CollectableScooterFeed[] {
  const named = new Map(systems.filter(system => system.birdAppSupplement).map(system => [system.id, system]));
  return feeds.map(feed => {
    const system = named.get(feed.id.slice(feed.id.indexOf(':') + 1));
    const rings = system?.birdAppSupplement ? birdAreaRings(system.birdAppSupplement) : undefined;
    if (!system || !rings || !system.timeZone || feed.provider !== system.provider || (system.provider !== 'bird' && system.provider !== 'spin')) return feed;
    const supplement = kept.get(feed.id) ?? new BirdSupplement({ ...system, provider: system.provider, timeZone: system.timeZone }, rings, api);
    kept.set(feed.id, supplement);
    const collect = feed.collect;
    return { ...feed, collect: () => supplement.collect(collect) };
  });
}
