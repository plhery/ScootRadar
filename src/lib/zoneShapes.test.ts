import { describe, expect, it } from 'vitest';
import { mergeZones } from './zoneShapes';
import type { MapZone } from './zones';

// A square of about 110 m by 110 m in Zürich, [lat, lng], from its south-west corner.
const square = (south: number, west: number, size = 0.001): [number, number][][] =>
  [[[south, west], [south, west + size], [south + size, west + size], [south + size, west], [south, west]]];
const zone = (id: string, kind: MapZone['kind'], ...polygons: [number, number][][][]): MapZone =>
  ({ id, provider: id.split(':')[0], kind, polygons });
const corners = (polygon: [number, number][][]) => polygon.map(ring => ring.length);
const extent = (polygon: [number, number][][]) => {
  const points = polygon[0];
  // To the centimetre: 47.37 + 0.001 is 47.370999999999995.
  return [Math.min(...points.map(p => p[0])), Math.min(...points.map(p => p[1])),
    Math.max(...points.map(p => p[0])), Math.max(...points.map(p => p[1]))].map(value => Number(value.toFixed(7)));
};

describe('merged zones', () => {
  it('draws the same rule of several operators as one shape within one edge', () => {
    const shapes = mergeZones([
      zone('lime:0', 'noParking', square(47.37, 8.54)),
      // The same street, a little further east, and the very same square again.
      zone('voi:0', 'noParking', square(47.37, 8.5405)),
      zone('bird:0', 'noParking', square(47.37, 8.54)),
    ]);
    expect(shapes).toHaveLength(1);
    expect(shapes[0].kind).toBe('noParking');
    expect(shapes[0].polygons).toHaveLength(1);
    expect(corners(shapes[0].polygons[0])).toEqual([5]);
    expect(extent(shapes[0].polygons[0])).toEqual([47.37, 8.54, 47.371, 8.5415]);
  });

  it('keeps each kind its own, zones apart apart, and holes open', () => {
    const ring = [
      [[47.37, 8.54], [47.37, 8.543], [47.373, 8.543], [47.373, 8.54], [47.37, 8.54]],
      [[47.371, 8.541], [47.372, 8.541], [47.372, 8.542], [47.371, 8.542], [47.371, 8.541]],
    ] as [number, number][][];
    const shapes = mergeZones([
      zone('dott:0', 'noRide', square(47.37, 8.54)),
      zone('bolt:0', 'noParking', square(47.37, 8.54)),
      zone('bolt:1', 'slow', square(47.37, 8.54), square(47.38, 8.55)),
      zone('voi:0', 'noRide', ring),
    ]);
    expect(shapes.map(shape => [shape.kind, shape.polygons.length])).toEqual([['noRide', 1], ['noParking', 1], ['slow', 2]]);
    // Dott's square lies within the frame of Voi's, whose hole stays open.
    const [noRide] = shapes[0].polygons;
    expect(corners(noRide)).toEqual([5, 5]);
    expect(extent(noRide)).toEqual([47.37, 8.54, 47.373, 8.543]);
  });

  it('merges only the zones handed in, so one provider shown shows its own', () => {
    const zones = [zone('lime:0', 'noRide', square(47.37, 8.54)), zone('voi:0', 'noRide', square(47.37, 8.5405))];
    expect(extent(mergeZones(zones)[0].polygons[0])).toEqual([47.37, 8.54, 47.371, 8.5415]);
    expect(extent(mergeZones(zones.filter(z => z.provider === 'lime'))[0].polygons[0])).toEqual([47.37, 8.54, 47.371, 8.541]);
    expect(mergeZones([])).toEqual([]);
  });
});
