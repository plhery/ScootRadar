import { createHash, createHmac, randomBytes } from 'node:crypto';
import { boundsCenter } from '../src/lib/geo';
import { CITY_OVERVIEW_MAX_ZOOM } from '../src/lib/mapCoverage';
import { SCOOTER_CLIENTS, SCOOTER_REFERRERS, type ScooterAgent, type ScooterClient, type ScooterReferrer } from '../src/lib/scooterClient';
import type { MapBounds } from '../src/lib/types';

/** The visitors are counted by UTC quarter hours, as the Lime refreshes they set off (metrics.ts). */
export const VISITOR_WINDOW_MS = 15 * 60_000;
/** An area is a cell of this many degrees of latitude and longitude, about 55 by 35 km in Zürich: a town and around it. */
export const AREA_DEGREES = 0.5;
/**
 * How many areas a visitor's requests keep collected in a quarter hour. Their requests for the areas past
 * these are answered from what the cache holds, collecting nothing, until the quarter hour ends. A map is
 * looked at in a town or two; a sweep of a country or of the world, which would keep every operator's feed
 * there collected each minute and the operators' accounts busy, comes to this within minutes.
 */
export const AREAS_WATCHED_PER_WINDOW = 32;
const AREAS_KEPT = 64;
const MAX_VISITORS = 10_000;
/** The visitors are also counted by UTC day: how many quarter hours their requests kept feeds collected. */
export const VISITOR_DAY_MS = 24 * 60 * 60_000;
/**
 * The quarter hours of a day a visitor without a map pass (a map of ours not yet verified, an app, or anyone
 * claiming to be one) may keep feeds collected: two hours. The web map holds a pass once Turnstile has passed
 * (src/lib/mapPass.ts) and is not held to it. Enforced for the agents named in `enforceAllowance` (browsers),
 * counted for all, until a week of counts shows how many of the apps' users would reach it
 * (docs/OBSERVABILITY.md, "Scraping").
 */
export const UNVERIFIED_QUARTER_HOURS_PER_DAY = 8;
/**
 * A visitor that asks all day, pass or not, is a script: a map is looked at for a while, and stops refreshing half
 * an hour after the last touch. With `holdSustained`, one collects nothing more that UTC day from the request
 * that makes BUSY_QUARTER_HOURS_PER_DAY quarter hours with BUSY_QUARTER_REQUESTS requests or more, or from the one
 * that makes the quarter hour after UNBROKEN_QUARTER_HOURS in a row with UNBROKEN_QUARTER_REQUESTS requests or more.
 * From 12 to 18 November 2026 no rider or app user came to either; the script polling North Rhine-Westphalia came to
 * both, and a home server's polling one town to the second (docs/OBSERVABILITY.md, "Scraping").
 *
 * A quarter hour with a request or two does not count in a run: a home's few devices, a phone looked at now and
 * then beside a computer, ask in many quarter hours in a row with a few requests each. On 19 November 2026 such a
 * home asked in 14 quarter hours in a row and was held; from 13 to 19 November its longest run of quarter hours with
 * 5 requests or more was 3 (8 on a day of testing the apps there), while the scripts kept theirs: North
 * Rhine-Westphalia's 32 (about 90 requests a quarter hour), a bare `Mozilla/5.0`'s 12 (about 55), and the home
 * server's 9 (about 6). No outside browser or app made 9 in a row at all.
 */
export const BUSY_QUARTER_REQUESTS = 20;
export const BUSY_QUARTER_HOURS_PER_DAY = 12;
export const UNBROKEN_QUARTER_HOURS = 8;
export const UNBROKEN_QUARTER_REQUESTS = 5;
/**
 * The requests for scooters a network (an IPv4 address or an IPv6 /64) may make in a UTC day, and in a UTC hour, before
 * the rest are answered from what the cache holds, collecting nothing, until the day or the hour ends: anyone's,
 * browsers' and apps', pass or not. From 12 to 18 November 2026 the busiest rider made 447 in a day and 276 in an hour,
 * the busiest app's address 300 and 180; the script polling North Rhine-Westphalia 2,892 in a day. A carrier's NAT or a
 * school's or hotel's address puts many behind one: on 1 to 6 November one browser's address made some 2,600 a day.
 * Counted only with `countSecret` (VISITOR_COUNT_SECRET), under an HMAC of the network and the day or hour, which the
 * cache saves and takes back at a restart (savedCounts): no address is kept, and one day's keys are not the next's.
 */
export const NETWORK_REQUESTS_PER_DAY = 1_500;
export const NETWORK_REQUESTS_PER_HOUR = 300;
export const VISITOR_HOUR_MS = 60 * 60_000;
const MAX_NETWORKS = 50_000;
/**
 * Why a request was answered from what the cache holds: its visitor's allowance, its busy quarter hours, its unbroken
 * run, its network's requests of the day or of the hour.
 */
export type HeldReason = 'allowance' | 'busy' | 'unbroken' | 'daily' | 'hourly';
export const HELD_REASONS: readonly HeldReason[] = ['allowance', 'busy', 'unbroken', 'daily', 'hourly'];
const MAX_DAY_VISITORS = 50_000;

// The visitors of a quarter hour by their requests for scooters: a map left open asks every minute (15),
// one whose feeds are being collected again every three seconds (300).
export const REQUEST_BUCKETS: [string, number][] = [['1-15', 15], ['16-60', 60], ['61-300', 300], ['301+', Infinity]];
// And by the areas they asked for, at a zoom past the city totals: up to 1, 3, 7… and 64 or more.
export const AREA_BUCKETS: [string, number][] = [['1', 1], ['2-3', 3], ['4-7', 7], ['8-15', 15], ['16-31', 31],
  ['32-63', 63], ['64+', Infinity]];
// The visitors of a day by the quarter hours their requests kept feeds collected: up to the allowance (8),
// past it, and from 8 hours (32), which no map we have seen keeps busy.
export const QUARTER_HOUR_BUCKETS: [string, number][] = [['1', 1], ['2-3', 3], ['4-8', 8], ['9-15', 15], ['16-31', 31],
  ['32+', Infinity]];

export interface VisitorCounts {
  /** Visitors of the closed quarter hours by their requests, counted since the start. */
  byRequests: [string, number][];
  /** Visitors of the closed quarter hours by the areas they asked for. */
  byAreas: [string, number][];
  /** Requests answered without collecting their view's feeds again: their visitor had spent their areas. */
  unwatched: number;
  /** Of the last closed quarter hour, the most requests and the most areas one visitor made (areas at most 64). */
  lastWindow: { requests: number; areas: number };
  /** Requests for scooters by the client the Worker made them out to be (scooterClient.ts); other collects nothing. */
  byClient: [ScooterClient, number][];
  /**
   * Visitors of the closed UTC days by the quarter hours their requests kept feeds collected, those without a
   * pass (unverified) and with one (verified) apart.
   */
  days: { unverified: [string, number][]; verified: [string, number][] };
  /** Requests without a pass past their visitor's UNVERIFIED_QUARTER_HOURS_PER_DAY, of any agent, enforced or not. */
  pastAllowance: number;
  /** Requests answered from what the cache holds, collecting nothing, by why (HeldReason). */
  held: [HeldReason, number][];
  /** The most quarter hours one visitor without a pass has kept feeds collected today. */
  mostUnverifiedToday: number;
  /** Requests for scooters by the agent and the kind of referrer the Worker named (scooterClient.ts). */
  byReferrer: [ScooterAgent, ScooterReferrer, number][];
}

/**
 * The networks' counts of the UTC day and hour, as the cache saves them beside the snapshot: each key an HMAC of a
 * network and its day or hour with the cache's secret, so the file holds no address, and keys of another day or
 * secret count for no one.
 */
export interface SavedNetworkCounts {
  version: 1;
  day: number;
  hour: number;
  daily: [string, number][];
  hourly: [string, number][];
}

interface PeriodCounts { period: number; counts: Map<string, number> }

/** The area of a box: the cell its middle is in. */
export function areaOf(bounds: MapBounds): string {
  const [lat, lng] = boundsCenter(bounds);
  return `${Math.floor(lat / AREA_DEGREES)},${Math.floor(lng / AREA_DEGREES)}`;
}

interface VisitorDay {
  /** Quarter hours kept collected without a pass, and with one. */
  unverified: number;
  verified: number;
  /** Of the quarter hours without a pass, those of an agent held to the allowance. */
  enforced: number;
  /** The last quarter hour counted of each. */
  unverifiedWindow: number;
  verifiedWindow: number;
  enforcedWindow: number;
  /**
   * Quarter hours with BUSY_QUARTER_REQUESTS requests or more, and the quarter hours in a row with
   * UNBROKEN_QUARTER_REQUESTS or more up to the last.
   */
  busy: number;
  run: number;
  /** The last quarter hour with UNBROKEN_QUARTER_REQUESTS requests. */
  activeWindow: number;
  /** Why it collects nothing more today, once its busy quarter hours or its run have said it is a script. */
  sustained: 'busy' | 'unbroken' | null;
}

/**
 * The requests and areas of each visitor in the current quarter hour, by a hash of their address salted
 * afresh by each process. No address is kept, and the hashes go when the quarter hour closes, into the
 * buckets' counts; those of the day's quarter hours, when the UTC day closes. A scraper reads as one visitor
 * asking for many areas, or for a town all day; a map, for one or a few, for a while.
 * `enforceAllowance`: a visitor without a pass, of one of these agents, past UNVERIFIED_QUARTER_HOURS_PER_DAY of
 * them collects nothing more that day. `holdSustained`: nor does one that asks all day (BUSY_QUARTER_HOURS_PER_DAY,
 * UNBROKEN_QUARTER_HOURS). `countSecret`: each network's requests of the UTC day and hour are counted under an HMAC
 * of it and the day or hour with this secret, kept across a restart (savedCounts, restoreCounts), and past
 * NETWORK_REQUESTS_PER_DAY or NETWORK_REQUESTS_PER_HOUR collect nothing more until it ends; without it, neither.
 */
export function createVisitorLedger({ enforceAllowance = [], holdSustained = false, countSecret }:
  { enforceAllowance?: readonly ScooterAgent[]; holdSustained?: boolean; countSecret?: string } = {}) {
  const salt = randomBytes(16);
  let window = 0;
  const visitors = new Map<string, { requests: number; watched: Set<string>; areas: Set<string> }>();
  const byRequests = new Map(REQUEST_BUCKETS.map(([bucket]) => [bucket, 0]));
  const byAreas = new Map(AREA_BUCKETS.map(([bucket]) => [bucket, 0]));
  const byClient = new Map(SCOOTER_CLIENTS.map(client => [client, 0]));
  let unwatched = 0;
  let lastWindow = { requests: 0, areas: 0 };
  let day = 0;
  const visitorDays = new Map<string, VisitorDay>();
  const unverifiedDays = new Map(QUARTER_HOUR_BUCKETS.map(([bucket]) => [bucket, 0]));
  const verifiedDays = new Map(QUARTER_HOUR_BUCKETS.map(([bucket]) => [bucket, 0]));
  let pastAllowance = 0;
  const held = new Map(HELD_REASONS.map(reason => [reason, 0]));
  const hold = (reason: HeldReason) => { held.set(reason, held.get(reason)! + 1); return false; };
  const byReferrer = new Map(['browser', 'app'].flatMap(agent => SCOOTER_REFERRERS.map(referrer => [`${agent} ${referrer}`, 0])));
  const daily: PeriodCounts = { period: -1, counts: new Map() };
  const hourly: PeriodCounts = { period: -1, counts: new Map() };
  const networkKey = (scope: 'day' | 'hour', period: number, network: string) =>
    createHmac('sha256', countSecret!).update(`${scope}:${period}:${network}`).digest().subarray(0, 16).toString('base64url');
  /** Moves the counts to the period, those of a past one dropped. */
  const turn = (counts: PeriodCounts, period: number) => {
    if (counts.period !== period) { counts.period = period; counts.counts.clear(); }
  };
  /** Counts a request against the network's period; how many it has made in it, 0 past MAX_NETWORKS for a new one. */
  const tally = (counts: PeriodCounts, scope: 'day' | 'hour', period: number, network: string) => {
    turn(counts, period);
    const key = networkKey(scope, period, network);
    const made = counts.counts.get(key);
    if (made === undefined && counts.counts.size >= MAX_NETWORKS) return 0;
    counts.counts.set(key, (made ?? 0) + 1);
    return (made ?? 0) + 1;
  };
  /** Counts the request against its network's day and hour; which limit it is past, if any. */
  const pastNetworkLimit = (network: string, now: number): 'daily' | 'hourly' | null => {
    if (!countSecret) return null;
    const today = tally(daily, 'day', Math.floor(now / VISITOR_DAY_MS), network);
    const thisHour = tally(hourly, 'hour', Math.floor(now / VISITOR_HOUR_MS), network);
    return today > NETWORK_REQUESTS_PER_DAY ? 'daily' : thisHour > NETWORK_REQUESTS_PER_HOUR ? 'hourly' : null;
  };
  const count = (counts: Map<string, number>, buckets: [string, number][], value: number) => {
    const [bucket] = buckets.find(([, most]) => value <= most)!;
    counts.set(bucket, counts.get(bucket)! + 1);
  };
  const close = (now: number) => {
    const current = Math.floor(now / VISITOR_WINDOW_MS);
    if (current === window) return;
    const most = { requests: 0, areas: 0 };
    for (const { requests, areas } of visitors.values()) {
      count(byRequests, REQUEST_BUCKETS, requests);
      if (areas.size) count(byAreas, AREA_BUCKETS, areas.size);
      most.requests = Math.max(most.requests, requests);
      most.areas = Math.max(most.areas, areas.size);
    }
    // The last closed quarter hour is the one before this: the visitors' own, or a later one without any.
    lastWindow = current === window + 1 ? most : { requests: 0, areas: 0 };
    visitors.clear();
    window = current;
  };
  const closeDay = (now: number) => {
    const current = Math.floor(now / VISITOR_DAY_MS);
    if (current === day) return;
    for (const { unverified, verified } of visitorDays.values()) {
      if (unverified) count(unverifiedDays, QUARTER_HOUR_BUCKETS, unverified);
      if (verified) count(verifiedDays, QUARTER_HOUR_BUCKETS, verified);
    }
    visitorDays.clear();
    day = current;
  };
  /** The visitor's day; undefined past MAX_DAY_VISITORS, when a new one is neither counted nor held back. */
  const dayOf = (id: string) => {
    let visitor = visitorDays.get(id);
    if (!visitor && visitorDays.size < MAX_DAY_VISITORS) {
      visitor = { unverified: 0, verified: 0, enforced: 0, unverifiedWindow: -1, verifiedWindow: -1, enforcedWindow: -1,
        busy: 0, run: 0, activeWindow: -1, sustained: null };
      visitorDays.set(id, visitor);
    }
    return visitor;
  };
  /** Counts the request's quarter hour, and its requests in it, against the visitor's day: whether it asks all day. */
  const sustained = (visitor: VisitorDay, requests: number) => {
    // The quarter hour joins the run at its UNBROKEN_QUARTER_REQUESTS-th request, once.
    if (requests === UNBROKEN_QUARTER_REQUESTS) {
      visitor.run = visitor.activeWindow === window - 1 ? visitor.run + 1 : 1;
      visitor.activeWindow = window;
    }
    if (requests === BUSY_QUARTER_REQUESTS) visitor.busy++;
    if (holdSustained && !visitor.sustained) {
      if (visitor.run > UNBROKEN_QUARTER_HOURS) visitor.sustained = 'unbroken';
      else if (visitor.busy >= BUSY_QUARTER_HOURS_PER_DAY) visitor.sustained = 'busy';
    }
    return visitor.sustained;
  };
  /** Counts the quarter hour against the visitor's day; whether it may still collect. */
  const allowance = (visitor: VisitorDay | undefined, verified: boolean, agent: ScooterAgent | null) => {
    if (!visitor) return true;
    if (verified) {
      if (visitor.verifiedWindow !== window) { visitor.verified++; visitor.verifiedWindow = window; }
      return true;
    }
    if (visitor.unverifiedWindow !== window) { visitor.unverified++; visitor.unverifiedWindow = window; }
    if (visitor.unverified > UNVERIFIED_QUARTER_HOURS_PER_DAY) pastAllowance++;
    if (!agent || !enforceAllowance.includes(agent)) return true;
    if (visitor.enforcedWindow !== window) { visitor.enforced++; visitor.enforcedWindow = window; }
    return visitor.enforced <= UNVERIFIED_QUARTER_HOURS_PER_DAY || hold('allowance');
  };

  return {
    /**
     * Counts a request for scooters by `client` (its address) for `bounds` at the zoom it is answered at, from
     * `asker`, the client the Worker made it out to be. Whether it may keep its view's feeds collected: never for
     * a client other than our maps and apps; false once its visitor has asked for AREAS_WATCHED_PER_WINDOW other
     * areas this quarter hour, with `holdSustained` once it has asked all day, and, with `enforceAllowance`, once
     * one without a pass, of an `agent` it names, has kept feeds collected UNVERIFIED_QUARTER_HOURS_PER_DAY quarter
     * hours today, and with `countSecret` once its network has made NETWORK_REQUESTS_PER_DAY requests today or
     * NETWORK_REQUESTS_PER_HOUR this hour, which every request counts towards. The city totals collect nothing and
     * count no area nor quarter hour. Past MAX_VISITORS in a quarter hour, a new visitor is neither counted nor held
     * back. `referrer`, the kind the Worker named, is counted by agent, and holds no one.
     */
    record(client: string, bounds: MapBounds, zoom: number | null, now = Date.now(), asker: ScooterClient = 'map',
      agent: ScooterAgent | null = null, referrer: ScooterReferrer | null = null): boolean {
      close(now);
      closeDay(now);
      byClient.set(asker, byClient.get(asker)! + 1);
      if (agent && referrer) byReferrer.set(`${agent} ${referrer}`, byReferrer.get(`${agent} ${referrer}`)! + 1);
      const pastLimit = pastNetworkLimit(client, now);
      const id = createHash('sha256').update(salt).update(client).digest('base64url');
      let visitor = visitors.get(id);
      if (!visitor) {
        if (visitors.size >= MAX_VISITORS) return asker !== 'other';
        visitor = { requests: 0, watched: new Set(), areas: new Set() };
        visitors.set(id, visitor);
      }
      visitor.requests++;
      const visitorDay = asker === 'other' ? undefined : dayOf(id);
      const script = visitorDay && sustained(visitorDay, visitor.requests);
      if (zoom !== null && zoom <= CITY_OVERVIEW_MAX_ZOOM) return asker !== 'other';
      const area = areaOf(bounds);
      if (visitor.areas.size < AREAS_KEPT) visitor.areas.add(area);
      if (asker === 'other') return false;
      if (script) return hold(script);
      if (pastLimit) return hold(pastLimit);
      if (!visitor.watched.has(area)) {
        if (visitor.watched.size >= AREAS_WATCHED_PER_WINDOW) { unwatched++; return false; }
        visitor.watched.add(area);
      }
      return allowance(visitorDay, asker === 'verified', agent);
    },
    counts(now = Date.now()): VisitorCounts {
      close(now);
      closeDay(now);
      let mostUnverifiedToday = 0;
      for (const { unverified } of visitorDays.values()) mostUnverifiedToday = Math.max(mostUnverifiedToday, unverified);
      return { byRequests: [...byRequests], byAreas: [...byAreas], unwatched, lastWindow, byClient: [...byClient],
        days: { unverified: [...unverifiedDays], verified: [...verifiedDays] }, pastAllowance, held: [...held],
        mostUnverifiedToday, byReferrer: [...byReferrer].map(([key, count]) => {
          const [agent, referrer] = key.split(' ') as [ScooterAgent, ScooterReferrer];
          return [agent, referrer, count];
        }) };
    },
    /** Whether the networks' requests are counted and held to NETWORK_REQUESTS_PER_DAY and _PER_HOUR (`countSecret`). */
    countsNetworks: !!countSecret,
    /** The networks' counts of the day and hour, to save; none without `countSecret`. */
    savedCounts(now = Date.now()): SavedNetworkCounts | undefined {
      if (!countSecret) return undefined;
      const day = Math.floor(now / VISITOR_DAY_MS), hour = Math.floor(now / VISITOR_HOUR_MS);
      turn(daily, day);
      turn(hourly, hour);
      return { version: 1, day, hour, daily: [...daily.counts], hourly: [...hourly.counts] };
    },
    /**
     * Takes back the counts savedCounts gave, those of this UTC day and hour, added to any made since the start; those
     * of another day or hour, or that cannot be read, are left. How many networks' counts of the day it took back.
     */
    restoreCounts(saved: unknown, now = Date.now()): number {
      if (!countSecret || typeof saved !== 'object' || !saved || (saved as SavedNetworkCounts).version !== 1) return 0;
      const { day, hour, daily: savedDaily, hourly: savedHourly } = saved as SavedNetworkCounts;
      const restore = (counts: PeriodCounts, period: number, savedPeriod: unknown, entries: unknown) => {
        turn(counts, period);
        if (savedPeriod !== period || !Array.isArray(entries)) return 0;
        let restored = 0;
        for (const entry of entries) {
          if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !Number.isInteger(entry[1]) || entry[1] < 1) continue;
          const made = counts.counts.get(entry[0]);
          if (made === undefined && counts.counts.size >= MAX_NETWORKS) continue;
          counts.counts.set(entry[0], (made ?? 0) + entry[1]);
          restored++;
        }
        return restored;
      };
      restore(hourly, Math.floor(now / VISITOR_HOUR_MS), hour, savedHourly);
      return restore(daily, Math.floor(now / VISITOR_DAY_MS), day, savedDaily);
    },
  };
}

export type VisitorLedger = ReturnType<typeof createVisitorLedger>;
