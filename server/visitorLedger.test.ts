import { describe, expect, it } from 'vitest';
import { AREA_DEGREES, AREAS_WATCHED_PER_WINDOW, areaOf, createVisitorLedger, UNVERIFIED_QUARTER_HOURS_PER_DAY, VISITOR_DAY_MS,
  VISITOR_WINDOW_MS } from './visitorLedger';

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

  it('once enforced, refuses collection to a visitor without a pass past its allowance, until the next UTC day', () => {
    const day = Math.ceil(start / VISITOR_DAY_MS) * VISITOR_DAY_MS;
    const ledger = createVisitorLedger({ enforceAllowance: true });
    const at = (quarter: number) => day + quarter * VISITOR_WINDOW_MS;
    for (let i = 0; i < UNVERIFIED_QUARTER_HOURS_PER_DAY; i++) expect(ledger.record('192.0.2.1', view(), 16, at(i), 'app')).toBe(true);
    expect(ledger.record('192.0.2.1', view(), 16, at(UNVERIFIED_QUARTER_HOURS_PER_DAY), 'map')).toBe(false);
    // Once it holds a pass, it is not held back; nor is anyone else.
    expect(ledger.record('192.0.2.1', view(), 16, at(UNVERIFIED_QUARTER_HOURS_PER_DAY), 'verified')).toBe(true);
    expect(ledger.record('192.0.2.2', view(), 16, at(UNVERIFIED_QUARTER_HOURS_PER_DAY))).toBe(true);
    expect(ledger.record('192.0.2.1', view(), 16, day + VISITOR_DAY_MS, 'map')).toBe(true);
  });

  it('puts a box across the 180° line in the area of its middle', () => {
    expect(areaOf({ south: -37, west: 179.9, north: -36.9, east: -179.7 })).toBe(areaOf({ south: -37, west: -179.95, north: -36.9, east: -179.85 }));
  });
});
