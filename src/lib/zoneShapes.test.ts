import { describe, expect, it } from 'vitest';
import type { RuleKind, RuleZoneShape } from './ruleZones';
import { mergeZones } from './zoneShapes';
import type { MapZone } from './zones';

// A square of about 110 m by 110 m in Zürich, [lat, lng], from its south-west corner.
const square = (south: number, west: number, size = 0.001): [number, number][][] =>
  [[[south, west], [south, west + size], [south + size, west + size], [south + size, west], [south, west]]];
const zone = (id: string, kind: MapZone['kind'], ...polygons: [number, number][][][]): MapZone =>
  ({ id, provider: id.split(':')[0], kind, polygons });
const rule = (id: string, kind: RuleKind, polygon: [number, number][][], more: Partial<RuleZoneShape> = {}): RuleZoneShape => ({
  id, place: 'Zürich', authority: 'Stadt Zürich', rule: kind, timeZone: 'Europe/Zurich', source: { title: '', url: '' },
  ring: polygon[0], polygons: [polygon], inForce: true, ...more,
}) as RuleZoneShape;
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
    expect(shapes.map(shape => [shape.kind, shape.polygons.length])).toEqual([['slow', 2], ['noParking', 1], ['noRide', 1]]);
    // Dott's square lies within the frame of Voi's, whose hole stays open.
    const [noRide] = shapes[2].polygons;
    expect(corners(noRide)).toEqual([5, 5]);
    expect(extent(noRide)).toEqual([47.37, 8.54, 47.373, 8.543]);
  });

  it('merges only the zones handed in, so one provider shown shows its own', () => {
    const zones = [zone('lime:0', 'noRide', square(47.37, 8.54)), zone('voi:0', 'noRide', square(47.37, 8.5405))];
    expect(extent(mergeZones(zones)[0].polygons[0])).toEqual([47.37, 8.54, 47.371, 8.5415]);
    expect(extent(mergeZones(zones.filter(z => z.provider === 'lime'))[0].polygons[0])).toEqual([47.37, 8.54, 47.371, 8.541]);
    expect(mergeZones([])).toEqual([]);
  });

  it('merges a city\'s zone with the operators\' of its kind, and keeps its rules out of their hours and with hours apart', () => {
    const shapes = mergeZones([zone('bird:0', 'noParking', square(47.37, 8.54))], [
      // Over the east half of Bird's, as Zürich's no-parking zone over the Gessnerbrücke is over the operators'.
      rule('zurich-no-parking-1', 'noParking', square(47.37, 8.5405)),
      rule('zurich-parking-1', 'parking', square(47.37, 8.5405)),
      rule('seoul-1', 'noRide', square(47.37, 8.54), { hours: [{ from: '12:00', until: '23:00' }] }),
      rule('seoul-2', 'noRide', square(47.37, 8.5405), { hours: [{ from: '12:00', until: '23:00' }], inForce: false }),
      rule('nagoya-1', 'pavement', [], { polygons: [], lines: [[[47.37, 8.54], [47.371, 8.54]]] }),
    ]);
    expect(shapes.map(({ kind, inForce, timed, polygons }) => [kind, inForce, timed, polygons.length])).toEqual([
      ['parking', true, false, 1], ['noParking', true, false, 1], ['noRide', false, true, 1], ['noRide', true, true, 1],
    ]);
    expect(corners(shapes[1].polygons[0])).toEqual([5]);
    expect(extent(shapes[1].polygons[0])).toEqual([47.37, 8.54, 47.371, 8.5415]);
  });

  it('joins zones that meet edge to edge, and turns every outer ring one way and its holes the other', () => {
    // Clockwise, as some feeds have it, with a hole turned the same way.
    const clockwise: [number, number][][] = [
      [[47.37, 8.54], [47.373, 8.54], [47.373, 8.543], [47.37, 8.543], [47.37, 8.54]],
      [[47.371, 8.541], [47.372, 8.541], [47.372, 8.542], [47.371, 8.542], [47.371, 8.541]],
    ];
    const twiceArea = (ring: [number, number][]) =>
      ring.reduce((sum, [x0, y0], index) => { const [x1, y1] = ring[(index + 1) % ring.length]; return sum + x0 * y1 - x1 * y0; }, 0);
    const [alone] = mergeZones([zone('voi:0', 'noRide', clockwise)]);
    expect(alone.polygons[0].map(ring => Math.sign(twiceArea(ring)))).toEqual([1, -1]);
    // The second's west edge the first's east, to the last bit.
    const [touching] = mergeZones([zone('lime:0', 'slow', square(47.37, 8.54)), zone('lime:1', 'slow', square(47.37, 8.54 + 0.001))]);
    expect(touching.polygons).toHaveLength(1);
    expect(extent(touching.polygons[0])).toEqual([47.37, 8.54, 47.371, 8.542]);
  });

  it('gives the same shape again for the same zones, kept from the last time', () => {
    const zones = [zone('lime:0', 'noRide', square(47.37, 8.54)), zone('voi:0', 'noRide', square(47.37, 8.5405))];
    const [first] = mergeZones(zones);
    const [again] = mergeZones([...zones].reverse());
    expect(again.polygons[0]).toBe(first.polygons[0]);
    // Another zone of the same rule, apart from them, leaves their shape as it was.
    const [more] = mergeZones([...zones, zone('bird:0', 'noRide', square(47.38, 8.55))]);
    expect(more.polygons).toHaveLength(2);
    expect(more.polygons).toContain(first.polygons[0]);
  });
});
