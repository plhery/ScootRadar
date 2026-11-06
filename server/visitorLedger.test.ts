import { describe, expect, it } from 'vitest';
import { AREA_DEGREES, AREAS_WATCHED_PER_WINDOW, areaOf, createVisitorLedger, VISITOR_WINDOW_MS } from './visitorLedger';

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

  it('puts a box across the 180° line in the area of its middle', () => {
    expect(areaOf({ south: -37, west: 179.9, north: -36.9, east: -179.7 })).toBe(areaOf({ south: -37, west: -179.95, north: -36.9, east: -179.85 }));
  });
});
