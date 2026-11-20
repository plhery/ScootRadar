import { describe, expect, it } from 'vitest';
import { AREA_DEGREES, AREAS_WATCHED_PER_WINDOW, areaOf, BUSY_QUARTER_HOURS_PER_DAY, BUSY_QUARTER_REQUESTS, createVisitorLedger,
  NETWORK_REQUESTS_PER_DAY, NETWORK_REQUESTS_PER_HOUR, PASS_GRACE_REQUESTS, UNBROKEN_QUARTER_HOURS, UNBROKEN_QUARTER_REQUESTS, UNVERIFIED_QUARTER_HOURS_PER_DAY, VISITOR_DAY_MS,
  VISITOR_HOUR_MS, VISITOR_WINDOW_MS } from './visitorLedger';

// A street view in the area `index` cells east of Zürich's.
const view = (index = 0) => ({ south: 47.36, west: 8.53 + index * AREA_DEGREES, north: 47.38, east: 8.56 + index * AREA_DEGREES });
const start = Math.ceil(Date.now() / VISITOR_WINDOW_MS) * VISITOR_WINDOW_MS;

describe('visitor ledger', () => {
  it('counts each visitor of a quarter hour once it closes, by requests and areas, keeping no address', () => {
    const ledger = createVisitorLedger();
    for (let i = 0; i < 20; i++) ledger.record('192.0.2.1', view(), 16, start + i * 1000);
    for (let i = 0; i < 5; i++) ledger.record('192.0.2.2', view(i), 14, start + i * 1000);
    // The city totals count a request but no area.
    ledger.record('192.0.2.3', view(), 8, start);
    expect(ledger.counts(start + 60_000).byRequests.every(([, count]) => count === 0)).toBe(true);
    const counts = ledger.counts(start + VISITOR_WINDOW_MS);
    expect(Object.fromEntries(counts.byRequests)).toEqual({ '1-15': 2, '16-60': 1, '61-300': 0, '301+': 0 });
    expect(Object.fromEntries(counts.byAreas)).toMatchObject({ 1: 1, '4-7': 1, '2-3': 0 });
    expect(counts.lastWindow).toEqual({ requests: 20, areas: 5 });
    expect(JSON.stringify(counts)).not.toContain('192.0.2');
    // A quarter hour later without visitors: the last one had none.
    expect(ledger.counts(start + 2 * VISITOR_WINDOW_MS).lastWindow).toEqual({ requests: 0, areas: 0 });
  });

  it('lets a visitor keep collected the areas of a map, and not a sweep past them', () => {
    const ledger = createVisitorLedger();
    const watched = Array.from({ length: AREAS_WATCHED_PER_WINDOW + 5 }, (_, i) => ledger.record('192.0.2.1', view(i), 16, start));
    expect(watched.filter(Boolean)).toHaveLength(AREAS_WATCHED_PER_WINDOW);
    expect(watched.slice(AREAS_WATCHED_PER_WINDOW).some(Boolean)).toBe(false);
    // The areas it has keep being collected; another visitor is not held back.
    expect(ledger.record('192.0.2.1', view(0), 16, start)).toBe(true);
    expect(ledger.record('192.0.2.2', view(AREAS_WATCHED_PER_WINDOW + 1), 16, start)).toBe(true);
    // Nor are the city totals, which collect nothing.
    expect(ledger.record('192.0.2.1', view(AREAS_WATCHED_PER_WINDOW + 1), 9, start)).toBe(true);
    expect(ledger.counts(start).unwatched).toBe(5);
    // The next quarter hour starts afresh.
    expect(ledger.record('192.0.2.1', view(AREAS_WATCHED_PER_WINDOW + 1), 16, start + VISITOR_WINDOW_MS)).toBe(true);
    expect(Object.fromEntries(ledger.counts(start + VISITOR_WINDOW_MS).byAreas)).toMatchObject({ '32-63': 1 });
  });

  it('keeps nothing collected for a client that is none of our maps and apps, and counts requests by client', () => {
    const ledger = createVisitorLedger();
    expect(ledger.record('192.0.2.1', view(), 16, start, 'other')).toBe(false);
    // Not even the city totals, which a map's request may set collecting where nothing is held yet.
    expect(ledger.record('192.0.2.1', view(), 8, start, 'other')).toBe(false);
    expect(ledger.record('192.0.2.2', view(), 16, start, 'verified')).toBe(true);
    expect(ledger.record('192.0.2.3', view(), 16, start, 'app')).toBe(true);
    expect(ledger.record('192.0.2.4', view(), 16, start)).toBe(true);
    const counts = ledger.counts(start);
    expect(Object.fromEntries(counts.byClient)).toEqual({ verified: 1, map: 1, app: 1, other: 2 });
    // Its requests and areas are counted as any visitor's, and none of its quarter hours.
    expect(Object.fromEntries(ledger.counts(start + VISITOR_WINDOW_MS).byRequests)).toMatchObject({ '1-15': 4 });
    expect(counts.mostUnverifiedToday).toBe(1);
  });

  it('counts the quarter hours a day each visitor keeps feeds collected, and those past the allowance without a pass', () => {
    const day = Math.ceil(start / VISITOR_DAY_MS) * VISITOR_DAY_MS;
    const ledger = createVisitorLedger();
    const hours = UNVERIFIED_QUARTER_HOURS_PER_DAY + 2;
    // A map without a pass, a quarter hour after another, two requests in each; one with a pass as long.
    const unverified = Array.from({ length: hours }, (_, i) => [0, 1].map(s => ledger.record('192.0.2.1', view(), 16, day + i * VISITOR_WINDOW_MS + s * 1000)));
    const verified = Array.from({ length: hours }, (_, i) => ledger.record('192.0.2.2', view(), 16, day + i * VISITOR_WINDOW_MS, 'verified'));
    // Counted, not enforced: every request still collects.
    expect(unverified.flat().every(Boolean)).toBe(true);
    expect(verified.every(Boolean)).toBe(true);
    const today = ledger.counts(day + (hours - 1) * VISITOR_WINDOW_MS);
    expect(today.pastAllowance).toBe(4);
    expect(today.mostUnverifiedToday).toBe(hours);
    // The city totals keep nothing collected, and count no quarter hour.
    ledger.record('192.0.2.3', view(), 8, day);
    const closed = ledger.counts(day + VISITOR_DAY_MS);
    expect(Object.fromEntries(closed.days.unverified)).toEqual({ 1: 0, '2-3': 0, '4-8': 0, '9-15': 1, '16-31': 0, '32+': 0 });
    expect(Object.fromEntries(closed.days.verified)).toMatchObject({ '9-15': 1 });
    expect(closed.mostUnverifiedToday).toBe(0);
  });

  it('once enforced for browsers, refuses collection to one without a pass past its allowance, until the next UTC day', () => {
    const day = Math.ceil(start / VISITOR_DAY_MS) * VISITOR_DAY_MS;
    const ledger = createVisitorLedger({ enforceAllowance: ['browser'] });
    const at = (quarter: number) => day + quarter * VISITOR_WINDOW_MS;
    const past = UNVERIFIED_QUARTER_HOURS_PER_DAY;
    // An app and a browser behind one address, a quarter hour after another: the app is counted, not held.
    for (let i = 0; i < past; i++) {
      expect(ledger.record('192.0.2.1', view(), 16, at(i), 'map', 'app')).toBe(true);
      expect(ledger.record('192.0.2.1', view(), 16, at(i), 'map', 'browser')).toBe(true);
    }
    expect(ledger.record('192.0.2.1', view(), 16, at(past), 'map', 'app')).toBe(true);
    expect(ledger.record('192.0.2.1', view(), 16, at(past), 'map', 'browser')).toBe(false);
    expect(ledger.record('192.0.2.1', view(), 16, at(past + 1), 'map', 'browser')).toBe(false);
    // Nor is a request from a Worker that names no agent.
    expect(ledger.record('192.0.2.1', view(), 16, at(past + 1), 'map', 'app')).toBe(true);
    expect(ledger.record('192.0.2.1', view(), 16, at(past + 1), 'map')).toBe(true);
    // Once it holds a pass, it is not held back; nor is anyone else.
    expect(ledger.record('192.0.2.1', view(), 16, at(past + 1), 'verified', 'browser')).toBe(true);
    expect(ledger.record('192.0.2.2', view(), 16, at(past + 1), 'map', 'browser')).toBe(true);
    const counts = ledger.counts(at(past + 1));
    expect(Object.fromEntries(counts.held)).toEqual({ allowance: 2, busy: 0, unbroken: 0, daily: 0, hourly: 0 });
    expect(counts.pastAllowance).toBe(5);
    expect(ledger.record('192.0.2.1', view(), 16, day + VISITOR_DAY_MS, 'map', 'browser')).toBe(true);
  });

  it('holds a visitor that asks all day, pass or not, from its busy quarter hours or its unbroken run, until the next UTC day', () => {
    const day = Math.ceil(start / VISITOR_DAY_MS) * VISITOR_DAY_MS;
    const ledger = createVisitorLedger({ holdSustained: true });
    const at = (quarter: number, second = 0) => day + quarter * VISITOR_WINDOW_MS + second * 1000;
    // Busy every other quarter hour, so never long in a row: held from the request that makes the 12th busy.
    for (let i = 0; i < BUSY_QUARTER_HOURS_PER_DAY; i++) {
      for (let r = 1; r <= BUSY_QUARTER_REQUESTS; r++) {
        const collects = ledger.record('192.0.2.1', view(), 16, at(2 * i, r), 'verified', 'browser');
        expect(collects).toBe(i < BUSY_QUARTER_HOURS_PER_DAY - 1 || r < BUSY_QUARTER_REQUESTS);
      }
    }
    expect(ledger.record('192.0.2.1', view(), 16, at(2 * BUSY_QUARTER_HOURS_PER_DAY + 1), 'verified', 'browser')).toBe(false);
    // UNBROKEN_QUARTER_REQUESTS requests a quarter hour, in a row: held from the request that makes the quarter hour
    // after its run; a break starts the run again.
    const quarter = (network: string, i: number, requests = UNBROKEN_QUARTER_REQUESTS, zoom = 16) =>
      Array.from({ length: requests }, (_, r) => ledger.record(network, view(), zoom, at(i, r), 'map', 'app'));
    for (let i = 0; i < UNBROKEN_QUARTER_HOURS; i++) expect(quarter('192.0.2.2', i)).not.toContain(false);
    for (let i = UNBROKEN_QUARTER_HOURS + 1; i < 2 * UNBROKEN_QUARTER_HOURS + 1; i++) {
      expect(quarter('192.0.2.2', i)).not.toContain(false);
    }
    expect(quarter('192.0.2.2', 2 * UNBROKEN_QUARTER_HOURS + 1)).toEqual([...Array(UNBROKEN_QUARTER_REQUESTS - 1).fill(true), false]);
    // The city totals' requests count in the run too, though they collect nothing either way.
    for (let i = 0; i < UNBROKEN_QUARTER_HOURS; i++) quarter('192.0.2.3', i, UNBROKEN_QUARTER_REQUESTS, 8);
    expect(quarter('192.0.2.3', UNBROKEN_QUARTER_HOURS).at(-1)).toBe(false);
    expect(Object.fromEntries(ledger.counts(at(2 * UNBROKEN_QUARTER_HOURS + 1, 59)).held)).toEqual({ allowance: 0, busy: 2, unbroken: 2, daily: 0, hourly: 0 });
    expect(ledger.record('192.0.2.1', view(), 16, day + VISITOR_DAY_MS, 'verified', 'browser')).toBe(true);
    // Without holdSustained, the same run is only counted.
    const counted = createVisitorLedger();
    for (let i = 0; i <= UNBROKEN_QUARTER_HOURS; i++) {
      for (let r = 0; r < UNBROKEN_QUARTER_REQUESTS; r++) expect(counted.record('192.0.2.2', view(), 16, at(i, r), 'map', 'app')).toBe(true);
    }
  });

  it('counts no run of a home asking a few times a quarter hour all day', () => {
    const day = Math.ceil(start / VISITOR_DAY_MS) * VISITOR_DAY_MS;
    const ledger = createVisitorLedger({ holdSustained: true });
    // A phone looked at now and then beside a computer: a few requests in every quarter hour of the day.
    for (let i = 0; i < 96; i++) {
      for (let r = 0; r < UNBROKEN_QUARTER_REQUESTS - 1; r++) {
        expect(ledger.record('192.0.2.4', view(), 16, day + i * VISITOR_WINDOW_MS + r * 1000, 'map', 'app')).toBe(true);
      }
    }
    expect(Object.fromEntries(ledger.counts(day + VISITOR_DAY_MS - 1).held)).toEqual({ allowance: 0, busy: 0, unbroken: 0, daily: 0, hourly: 0 });
  });

  it('holds none of the guests of a hotel opening the map in nine quarter hours in a row, nor one after a long gap', () => {
    const day = Math.ceil(start / VISITOR_DAY_MS) * VISITOR_DAY_MS;
    const ledger = createVisitorLedger({ holdSustained: true });
    // One request in each of nine quarter hours from one address, each a guest with a verified browser.
    for (let i = 0; i < UNBROKEN_QUARTER_HOURS + 1; i++) {
      expect(ledger.record('192.0.2.5', view(), 16, day + i * VISITOR_WINDOW_MS, 'verified', 'browser')).toBe(true);
    }
    // And a guest nine hours later.
    expect(ledger.record('192.0.2.5', view(), 16, day + (UNBROKEN_QUARTER_HOURS + 36) * VISITOR_WINDOW_MS, 'verified', 'browser')).toBe(true);
    expect(Object.fromEntries(ledger.counts(day + VISITOR_DAY_MS - 1).held)).toEqual({ allowance: 0, busy: 0, unbroken: 0, daily: 0, hourly: 0 });
  });

  const secret = 'a-test-secret-of-at-least-32-characters';
  const day = Math.ceil(start / VISITOR_DAY_MS) * VISITOR_DAY_MS;
  // Requests from a network, `perHour` an hour from the day's start (spread over each hour), until `count` are made.
  const ask = (ledger: ReturnType<typeof createVisitorLedger>, network: string, count: number, perHour: number, from = day,
    asker: 'map' | 'verified' = 'map') => Array.from({ length: count }, (_, i) =>
    ledger.record(network, view(), 16, from + Math.floor(i / perHour) * VISITOR_HOUR_MS + (i % perHour) * 1000, asker, 'browser'));

  it('holds a network past its requests of the UTC day, pass or not, browser or app, until the day ends', () => {
    const ledger = createVisitorLedger({ countSecret: secret });
    // 250 an hour, under the hour's limit, over six hours: held from the request past the day's.
    const asked = ask(ledger, '192.0.2.1', NETWORK_REQUESTS_PER_DAY + 2, 250, day, 'verified');
    expect(asked.slice(0, NETWORK_REQUESTS_PER_DAY).every(Boolean)).toBe(true);
    expect(asked.slice(NETWORK_REQUESTS_PER_DAY)).toEqual([false, false]);
    const later = day + 7 * VISITOR_HOUR_MS;
    expect(ledger.record('192.0.2.1', view(), 16, later, 'map', 'app')).toBe(false);
    // Another network is not held; the city totals, which collect nothing, are answered as before.
    expect(ledger.record('192.0.2.2', view(), 16, later, 'map', 'browser')).toBe(true);
    expect(ledger.record('192.0.2.1', view(), 8, later, 'map', 'browser')).toBe(true);
    expect(Object.fromEntries(ledger.counts(later).held)).toEqual({ allowance: 0, busy: 0, unbroken: 0, daily: 3, hourly: 0 });
    // The next UTC day starts afresh.
    expect(ledger.record('192.0.2.1', view(), 16, day + VISITOR_DAY_MS, 'map', 'browser')).toBe(true);
    // Without the secret, nothing is counted nor held.
    const off = createVisitorLedger();
    expect(ask(off, '192.0.2.1', NETWORK_REQUESTS_PER_DAY + 2, 250).every(Boolean)).toBe(true);
    expect(off.countsNetworks).toBe(false);
    expect(off.savedCounts(day)).toBeUndefined();
  });

  it('holds a network past its requests of the UTC hour, until the hour ends', () => {
    const ledger = createVisitorLedger({ countSecret: secret });
    const asked = ask(ledger, '2001:db8:1:2::', NETWORK_REQUESTS_PER_HOUR + 1, NETWORK_REQUESTS_PER_HOUR + 1);
    expect(asked.slice(0, NETWORK_REQUESTS_PER_HOUR).every(Boolean)).toBe(true);
    expect(asked[NETWORK_REQUESTS_PER_HOUR]).toBe(false);
    // A client of another network, and the same network's next hour, are not held.
    expect(ledger.record('2001:db8:1:3::', view(), 16, day + 1000, 'map', 'browser')).toBe(true);
    expect(ledger.record('2001:db8:1:2::', view(), 16, day + VISITOR_HOUR_MS, 'map', 'browser')).toBe(true);
    // A client other than our maps collects nothing anyway: its requests count, and are not counted as held.
    ledger.record('192.0.2.9', view(), 16, day, 'other');
    expect(Object.fromEntries(ledger.counts(day + VISITOR_HOUR_MS).held)).toMatchObject({ daily: 0, hourly: 1 });
  });

  it('keeps the day\'s and the hour\'s counts across a restart, under keys that hold no address and change each day', () => {
    const before = createVisitorLedger({ countSecret: secret });
    const at = day + 5 * VISITOR_HOUR_MS;
    ask(before, '192.0.2.1', NETWORK_REQUESTS_PER_DAY - 10, 250, day);
    ask(before, '192.0.2.2', NETWORK_REQUESTS_PER_HOUR - 1, 1000, at);
    const saved = JSON.parse(JSON.stringify(before.savedCounts(at + 60_000)));
    expect(JSON.stringify(saved)).not.toContain('192.0.2');
    expect(saved.daily).toHaveLength(2);
    // The new cache takes them back, and counts on from them.
    const after = createVisitorLedger({ countSecret: secret });
    expect(after.restoreCounts(saved, at + 120_000)).toBe(2);
    expect(after.record('192.0.2.2', view(), 16, at + 120_000, 'map', 'browser')).toBe(true);
    expect(after.record('192.0.2.2', view(), 16, at + 121_000, 'map', 'browser')).toBe(false);
    expect(ask(after, '192.0.2.1', 12, 1000, at + 122_000).filter(Boolean)).toHaveLength(10);
    // The saved hour's counts are left in a later hour, the day's in a later day.
    const nextHour = createVisitorLedger({ countSecret: secret });
    nextHour.restoreCounts(saved, at + VISITOR_HOUR_MS);
    expect(nextHour.record('192.0.2.2', view(), 16, at + VISITOR_HOUR_MS, 'map', 'browser')).toBe(true);
    const nextDay = createVisitorLedger({ countSecret: secret });
    expect(nextDay.restoreCounts(saved, day + VISITOR_DAY_MS)).toBe(0);
    expect(nextDay.savedCounts(day + VISITOR_DAY_MS)).toMatchObject({ daily: [], hourly: [] });
    // Another secret's keys count for no one.
    const rotated = createVisitorLedger({ countSecret: `${secret}, rotated` });
    rotated.restoreCounts(saved, at + 120_000);
    expect(ask(rotated, '192.0.2.1', 20, 1000, at + 120_000).every(Boolean)).toBe(true);
    // A network's key of one day is not its key of the next.
    const tomorrow = createVisitorLedger({ countSecret: secret });
    ask(tomorrow, '192.0.2.1', 1, 1, day + VISITOR_DAY_MS);
    const [[tomorrowKey]] = tomorrow.savedCounts(day + VISITOR_DAY_MS)!.daily;
    expect(saved.daily.map(([key]: [string]) => key)).not.toContain(tomorrowKey);
    // A file of another version, or one cut short, gives nothing back.
    expect(createVisitorLedger({ countSecret: secret }).restoreCounts({ ...saved, version: 2 }, at)).toBe(0);
    expect(createVisitorLedger({ countSecret: secret }).restoreCounts(null, at)).toBe(0);
  });

  it('answers a browser Turnstile could check its first requests of the day without a pass, then only with one', () => {
    const day = Math.ceil(start / VISITOR_DAY_MS) * VISITOR_DAY_MS;
    const ledger = createVisitorLedger({ requirePass: true });
    for (let i = 0; i < PASS_GRACE_REQUESTS; i++) expect(ledger.passRequired('192.0.2.1', true, 'map', day + i)).toBe(false);
    expect(ledger.passRequired('192.0.2.1', true, 'map', day + 30)).toBe(true);
    expect(ledger.passRequired('192.0.2.1', true, 'map', day + 31)).toBe(true);
    // Not once it holds a pass, nor where the Worker says Turnstile could not give it one (an app, another host).
    expect(ledger.passRequired('192.0.2.1', true, 'verified', day + 32)).toBe(false);
    expect(ledger.passRequired('192.0.2.1', false, 'map', day + 33)).toBe(false);
    // Another network has its own requests; the next UTC day, this one has them again.
    expect(ledger.passRequired('192.0.2.2', true, 'map', day + 34)).toBe(false);
    expect(ledger.counts(day + 35).passRequired).toBe(2);
    expect(ledger.passRequired('192.0.2.1', true, 'map', day + VISITOR_DAY_MS)).toBe(false);
    // Without `requirePass`, counted against the day and never refused.
    const counting = createVisitorLedger();
    for (let i = 0; i <= PASS_GRACE_REQUESTS; i++) expect(counting.passRequired('192.0.2.1', true, 'map', day + i)).toBe(false);
    expect(counting.counts(day + 40).passRequired).toBe(0);
  });

  it('counts the requests by agent and kind of referrer, holding no one by it', () => {
    const ledger = createVisitorLedger({ enforceAllowance: ['browser'] });
    expect(ledger.record('192.0.2.1', view(), 16, start, 'map', 'browser', 'own')).toBe(true);
    expect(ledger.record('192.0.2.2', view(), 16, start, 'map', 'browser', 'none')).toBe(true);
    expect(ledger.record('192.0.2.3', view(), 16, start, 'map', 'app', 'none')).toBe(true);
    ledger.record('192.0.2.3', view(), 16, start, 'other', 'browser', 'other');
    // From a Worker that names neither, not counted.
    ledger.record('192.0.2.4', view(), 16, start, 'map', null, 'own');
    ledger.record('192.0.2.4', view(), 16, start, 'map', 'browser', null);
    const counts = Object.fromEntries(ledger.counts(start).byReferrer.map(([agent, referrer, count]) => [`${agent} ${referrer}`, count]));
    expect(counts).toEqual({ 'browser own': 1, 'browser other': 1, 'browser none': 1, 'app own': 0, 'app other': 0, 'app none': 1 });
  });

  it('puts a box across the 180° line in the area of its middle', () => {
    expect(areaOf({ south: -37, west: 179.9, north: -36.9, east: -179.7 })).toBe(areaOf({ south: -37, west: -179.95, north: -36.9, east: -179.85 }));
  });
});
