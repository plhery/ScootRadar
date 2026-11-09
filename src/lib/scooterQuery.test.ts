import { describe, expect, it } from 'vitest';
import { SUPPORTED_MOBILITY_BOUNDS } from '@/lib/feedCoverage';
import { MAX_VIEW_PIXELS, parseScooterQuery, scooterAnswerZoom } from '@/lib/scooterQuery';

describe('parseScooterQuery', () => {
  it('parses valid bounds and known providers', () => {
    const result = parseScooterQuery(new URLSearchParams({
      lat: '47.3769',
      lng: '8.5417',
      south: '47.36',
      west: '8.52',
      north: '47.39',
      east: '8.57',
      minBattery: '25',
      minRange: '4828',
      provider: 'lime, dott',
      zoom: '15',
    }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.origin).toEqual([47.3769, 8.5417]);
    expect(result.query.minBattery).toBe(25);
    expect(result.query.minRange).toBe(4828);
    expect(result.query.providers).toEqual(new Set(['lime', 'dott']));
    expect(result.zoom).toBe(15);
  });

  it('clamps world-sized requests to the supported service envelope', () => {
    const result = parseScooterQuery(new URLSearchParams({
      south: '-90',
      north: '90',
      west: '-180',
      east: '180',
    }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.bounds).toEqual(SUPPORTED_MOBILITY_BOUNDS);
    expect(result.query.outsideCoverage).toBe(false);
    expect(result.query.origin).toBeNull();
  });

  it('accepts a view across the 180° line, west greater than east, cut to the supported envelope', () => {
    const result = parseScooterQuery(new URLSearchParams({
      south: '-47.06', west: '159.9', north: '-25.98', east: '-157.1', zoom: '6',
    }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Nothing is covered east of the line: what is left is New Zealand's side.
    expect(result.query.bounds).toEqual({
      south: Math.max(-47.06, SUPPORTED_MOBILITY_BOUNDS.south), west: 159.9, north: -25.98, east: SUPPORTED_MOBILITY_BOUNDS.east,
    });
    expect(result.query.outsideCoverage).toBe(false);
  });

  it('marks a view across the line away from every covered town as outside coverage', () => {
    const result = parseScooterQuery(new URLSearchParams({ south: '-20', west: '178', north: '-15', east: '-178' }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.outsideCoverage).toBe(true);
  });

  it('rejects a view with no width', () => {
    for (const [west, east] of [['8.5', '8.5'], ['180', '-180']]) {
      expect(parseScooterQuery(new URLSearchParams({ south: '47', west, north: '48', east }))).toEqual({
        ok: false,
        error: 'Invalid scooter search parameters',
      });
    }
  });

  it('marks views outside supported coverage so feeds can be skipped', () => {
    const result = parseScooterQuery(new URLSearchParams({
      lat: '6.5',
      lng: '3.4',
      south: '6.4',
      north: '6.6',
      west: '3.3',
      east: '3.5',
    }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.outsideCoverage).toBe(true);
  });

  it('takes a range minimum in whole metres, none when it is not asked for, as from older apps', () => {
    const minRange = (params: Record<string, string>) => {
      const result = parseScooterQuery(new URLSearchParams(params));
      return result.ok ? result.query.minRange : result.error;
    };
    expect(minRange({})).toBe(0);
    expect(minRange({ minRange: '0' })).toBe(0);
    expect(minRange({ minRange: '5000' })).toBe(5000);
    expect(minRange({ minRange: '200000' })).toBe(200_000);
    // The two together, which the clients never send, are both kept.
    const both = parseScooterQuery(new URLSearchParams({ minBattery: '60', minRange: '5000' }));
    expect(both.ok && [both.query.minBattery, both.query.minRange]).toEqual([60, 5000]);
  });

  it('rejects unknown providers and non-integer battery and range values', () => {
    expect(parseScooterQuery(new URLSearchParams({ provider: 'unknown' }))).toEqual({
      ok: false,
      error: 'Unknown scooter provider',
    });
    expect(parseScooterQuery(new URLSearchParams({ minBattery: '25.5' }))).toEqual({
      ok: false,
      error: 'Invalid scooter search parameters',
    });
    // A range minimum is whole metres, from none to the 200 km a range is believed up to.
    for (const minRange of ['4828.5', '-1', '200001', '', '5km', 'Infinity']) {
      expect(parseScooterQuery(new URLSearchParams({ minRange })), minRange).toEqual({
        ok: false,
        error: 'Invalid scooter search parameters',
      });
    }
    expect(parseScooterQuery(new URLSearchParams({ lat: '' }))).toEqual({
      ok: false,
      error: 'Invalid scooter search parameters',
    });
    expect(parseScooterQuery(new URLSearchParams({ lat: '47.3' }))).toEqual({
      ok: false,
      error: 'Invalid scooter search parameters',
    });
    expect(parseScooterQuery(new URLSearchParams({ zoom: '15.5' }))).toEqual({
      ok: false,
      error: 'Invalid scooter search parameters',
    });
    expect(parseScooterQuery(new URLSearchParams({ zoom: '23' }))).toEqual({
      ok: false,
      error: 'Invalid scooter search parameters',
    });
  });
});

describe('scooterAnswerZoom', () => {
  // A box `pixels` wide (and a little less tall) at `zoom`, around Zürich.
  const box = (pixels: number, zoom: number) => {
    const span = pixels * 360 / (256 * 2 ** zoom);
    return { south: 47.37 - span * 0.33, west: 8.54 - span / 2, north: 47.37 + span * 0.33, east: 8.54 + span / 2 };
  };

  it("answers a screen's view at the zoom it asks for, however large the screen", () => {
    for (const zoom of [11, 13, 16, 19]) {
      expect(scooterAnswerZoom(zoom, box(430, zoom))).toBe(zoom);
      // A 4K screen turned at 45°: its bounds enclose the diagonal.
      expect(scooterAnswerZoom(zoom, box(4_243, zoom))).toBe(zoom);
      expect(scooterAnswerZoom(zoom, box(MAX_VIEW_PIXELS - 1, zoom))).toBe(zoom);
    }
    expect(scooterAnswerZoom(null, box(1_920, 16))).toBeNull();
  });

  it('answers a box no screen shows at its zoom at the highest zoom it fits', () => {
    expect(scooterAnswerZoom(16, box(MAX_VIEW_PIXELS * 1.5, 16))).toBe(15);
    expect(scooterAnswerZoom(16, box(MAX_VIEW_PIXELS * 64, 16))).toBe(10);
    // The whole supported envelope at street zoom: the city totals.
    expect(scooterAnswerZoom(16, SUPPORTED_MOBILITY_BOUNDS)).toBeLessThanOrEqual(6);
    // Without a zoom, every scooter only for a box that fits past the clusters' zooms.
    expect(scooterAnswerZoom(null, box(MAX_VIEW_PIXELS * 2, 16))).toBe(15);
    expect(scooterAnswerZoom(null, SUPPORTED_MOBILITY_BOUNDS)).toBeLessThanOrEqual(6);
  });

  it('measures a tall box by its height on the map, and a box across the 180° line by its width', () => {
    // Narrow but 2° tall at 60°N: 23,000 pixels at zoom 13 on the map, twice as many as at the equator.
    const tall = { south: 59, west: 10.7, north: 61, east: 10.75 };
    expect(scooterAnswerZoom(12, tall)).toBe(12);
    expect(scooterAnswerZoom(13, tall)).toBe(12);
    const acrossTheLine = { south: -37, west: 179.9, north: -36.9, east: -179.9 };
    expect(scooterAnswerZoom(16, acrossTheLine)).toBe(16);
  });
});

