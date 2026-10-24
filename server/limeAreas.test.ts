import { describe, expect, it } from 'vitest';
import { boundsContainPoint } from '../src/lib/geo';
import { decodeLimeArea, limeAreaBounds, limeAreaMeetsBox, limeAreaTiles } from './limeAreas';

describe('Lime publisher service outlines', () => {
  it('decodes a Google polyline and rejects incomplete or out-of-world outlines', () => {
    expect(decodeLimeArea('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);
    expect(() => decodeLimeArea('_')).toThrow('Invalid Lime service outline');
    expect(() => decodeLimeArea('??')).toThrow('has no area');
  });
  it('finds intersections through edges even when neither polygon nor rectangle contains a corner', () => {
    const strip: [number, number][] = [[0.004, -1], [.006, -1], [.006, 1], [.004, 1]];
    expect(limeAreaMeetsBox(strip, { south: 0, north: .01, west: 0, east: .01 })).toBe(true);
    expect(limeAreaMeetsBox(strip, { south: .1, north: .2, west: 0, east: .01 })).toBe(false);
  });
  it('covers every part of separated service polygons with local views, including currently empty portions', () => {
    const areas: [number, number][][] = [
      [[0, 0], [0, .04], [.04, .04], [.04, 0]],
      [[.06, .06], [.06, .07], [.07, .07], [.07, .06]],
    ];
    expect(limeAreaBounds(areas)).toEqual({ south: 0, north: .07, west: 0, east: .07 });
    const tiles = limeAreaTiles(areas);
    expect(tiles.length).toBeGreaterThan(1);
    for (const [lat, lng] of [[.001, .001], [.039, .001], [.001, .039], [.039, .039], [.065, .065]]) {
      expect(tiles.some(tile => boundsContainPoint(tile, lat, lng))).toBe(true);
    }
    expect(tiles.some(tile => boundsContainPoint(tile, .05, .05))).toBe(false);
    expect(tiles.every(tile => (tile.north - tile.south) * 111_320 <= 1500.00001)).toBe(true);
    expect(tiles.every(tile => (tile.east - tile.west) * 111_320 <= 1500.00001)).toBe(true);
  });
});
