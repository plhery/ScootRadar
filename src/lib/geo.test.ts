import { describe, expect, it } from 'vitest';
import {
  boundsCenter,
  boundsContainBounds,
  boundsContainPoint,
  boundsIntersect,
  boundsIntersection,
  crossesDateLine,
  expandBounds,
  lngNear,
  lngSpan,
  viewBounds,
  viewportContainsPoint,
  wrapLng,
} from '@/lib/geo';

// New Zealand lies just west of 180°: Auckland, Tauranga, and the Chatham Islands east of the line.
const AUCKLAND = [-36.8485, 174.7633] as const;
const TAURANGA = [-37.6878, 176.1651] as const;
const CHATHAM = [-43.95, -176.56] as const;
// A view at zoom 6 centred on 181.4°E, as Leaflet gives its edges: 21.5° each side.
const PAST_THE_LINE = viewBounds(-47.06, 159.9, -25.98, 202.9);

describe('longitudes', () => {
  it('wraps a longitude into -180..180 and keeps one already there', () => {
    expect(wrapLng(181.4)).toBeCloseTo(-178.6, 9);
    expect(wrapLng(-181.4)).toBeCloseTo(178.6, 9);
    expect(wrapLng(540)).toBeCloseTo(-180, 9);
    expect(wrapLng(180)).toBe(180);
    expect(wrapLng(-180)).toBe(-180);
    expect(wrapLng(8.5417)).toBe(8.5417);
  });

  it('finds the copy of a longitude nearest a reference', () => {
    expect(lngNear(AUCKLAND[1], -178.6)).toBeCloseTo(174.7633 - 360, 9);
    expect(lngNear(AUCKLAND[1], 181.4)).toBe(AUCKLAND[1]);
    expect(lngNear(CHATHAM[1], 175)).toBeCloseTo(-176.56 + 360, 9);
    // Three worlds away, as a map panned round and round has it.
    expect(lngNear(AUCKLAND[1], 1081.4)).toBeCloseTo(174.7633 + 1080, 9);
    expect(lngNear(8.5417, 8.5)).toBe(8.5417);
  });

  it('measures a box across the line from its west, round 180°, to its east', () => {
    expect(crossesDateLine({ west: 170, east: -170 })).toBe(true);
    expect(crossesDateLine({ west: -170, east: 170 })).toBe(false);
    expect(lngSpan({ west: 170, east: -170 })).toBe(20);
    expect(lngSpan({ west: -170, east: 170 })).toBe(340);
    expect(lngSpan({ west: -180, east: 180 })).toBe(360);
  });
});

describe('the box of a view', () => {
  it('keeps a view that does not reach the line as it is', () => {
    expect(viewBounds(47.36, 8.52, 47.39, 8.57)).toEqual({ south: 47.36, west: 8.52, north: 47.39, east: 8.57 });
    expect(viewBounds(-47, 155.9, -26, 180)).toEqual({ south: -47, west: 155.9, north: -26, east: 180 });
  });

  it('crosses the line when the view reaches past 180° east', () => {
    const view = viewBounds(-47, 159.9, -26, 202.9);
    expect(view.west).toBe(159.9);
    expect(view.east).toBeCloseTo(-157.1, 9);
    expect(crossesDateLine(view)).toBe(true);
    expect(lngSpan(view)).toBeCloseTo(43, 9);
  });

  it('crosses the line when the view reaches past 180° west', () => {
    // Centred on -178°: New Zealand at the left edge.
    const view = viewBounds(-47, -199.5, -26, -156.5);
    expect(view.west).toBeCloseTo(160.5, 9);
    expect(view.east).toBe(-156.5);
    expect(crossesDateLine(view)).toBe(true);
  });

  it('is the same box whichever copy of the world the view is in', () => {
    const here = viewBounds(-47, 159.9, -26, 202.9);
    const copy = viewBounds(-47, 159.9 - 720, -26, 202.9 - 720);
    expect(copy.west).toBeCloseTo(here.west, 9);
    expect(copy.east).toBeCloseTo(here.east, 9);
  });

  it('is the whole world when the view is wider than it', () => {
    expect(viewBounds(-85, -450, 85, 450)).toEqual({ south: -85, west: -180, north: 85, east: 180 });
    expect(viewBounds(-85, 100, 85, 460)).toEqual({ south: -85, west: -180, north: 85, east: 180 });
  });

  it('keeps an edge exactly on ±180° on the side of the rest of the view', () => {
    expect(viewBounds(-47, -180, -26, -150)).toEqual({ south: -47, west: -180, north: -26, east: -150 });
    expect(viewBounds(-47, 150, -26, 180)).toEqual({ south: -47, west: 150, north: -26, east: 180 });
    // 180° to 210°: the same as -180° to -150°.
    expect(viewBounds(-47, 180, -26, 210)).toEqual({ south: -47, west: -180, north: -26, east: expect.closeTo(-150, 9) });
    // -210° to -180°: the same as 150° to 180°.
    expect(viewBounds(-47, -210, -26, -180)).toEqual({ south: -47, west: expect.closeTo(150, 9), north: -26, east: 180 });
  });

  it('keeps latitudes on the globe', () => {
    expect(viewBounds(-95, 0, 95, 10)).toEqual({ south: -90, west: 0, north: 90, east: 10 });
  });
});

describe('boxes across the line', () => {
  it('hold what lies on either side of it', () => {
    expect(boundsContainPoint(PAST_THE_LINE, ...AUCKLAND)).toBe(true);
    expect(boundsContainPoint(PAST_THE_LINE, ...TAURANGA)).toBe(true);
    expect(boundsContainPoint(PAST_THE_LINE, ...CHATHAM)).toBe(true);
    expect(boundsContainPoint(PAST_THE_LINE, -36.8, 150)).toBe(false);
    expect(boundsContainPoint(PAST_THE_LINE, -36.8, -150)).toBe(false);
    expect(boundsContainPoint(PAST_THE_LINE, -20, 174.7)).toBe(false);
  });

  it('hold the meridian itself, written either way', () => {
    expect(boundsContainPoint(PAST_THE_LINE, -40, 180)).toBe(true);
    expect(boundsContainPoint(PAST_THE_LINE, -40, -180)).toBe(true);
  });

  it('meet boxes on either side of the line, and not those beyond them', () => {
    const tauranga = { south: -37.8, west: 176.0, north: -37.5, east: 176.4 };
    const chatham = { south: -44.4, west: -177, north: -43.6, east: -176.1 };
    const hawaii = { south: 18.9, west: -160.3, north: 22.3, east: -154.8 };
    const perth = { south: -32.1, west: 115.7, north: -31.8, east: 116.0 };
    expect(boundsIntersect(PAST_THE_LINE, tauranga)).toBe(true);
    expect(boundsIntersect(tauranga, PAST_THE_LINE)).toBe(true);
    expect(boundsIntersect(PAST_THE_LINE, chatham)).toBe(true);
    expect(boundsIntersect(PAST_THE_LINE, hawaii)).toBe(false);
    expect(boundsIntersect(PAST_THE_LINE, perth)).toBe(false);
    expect(boundsIntersect(PAST_THE_LINE, { south: -40, west: 179, north: -38, east: -179 })).toBe(true);
  });

  it('contain the boxes inside them, on one side or across', () => {
    expect(boundsContainBounds(PAST_THE_LINE, { south: -40, west: 170, north: -38, east: 175 })).toBe(true);
    expect(boundsContainBounds(PAST_THE_LINE, { south: -40, west: -170, north: -38, east: -160 })).toBe(true);
    expect(boundsContainBounds(PAST_THE_LINE, { south: -40, west: 170, north: -38, east: -170 })).toBe(true);
    expect(boundsContainBounds(PAST_THE_LINE, { south: -40, west: 150, north: -38, east: -170 })).toBe(false);
    expect(boundsContainBounds(PAST_THE_LINE, { south: -40, west: -10, north: -38, east: 10 })).toBe(false);
    // Only the whole world holds a box across the line without crossing it.
    expect(boundsContainBounds({ south: -90, west: -180, north: 90, east: 180 }, PAST_THE_LINE)).toBe(true);
    expect(boundsContainBounds({ south: -90, west: -179, north: 90, east: 179 }, PAST_THE_LINE)).toBe(false);
    expect(boundsContainBounds(PAST_THE_LINE, { south: -90, west: -180, north: 90, east: 180 })).toBe(false);
  });

  it('cut boxes to what they share', () => {
    // The envelope of the map's coverage, from the Americas to New Zealand, holds only the west side.
    const envelope = { south: -46, west: -123.3, north: 70, east: 176.4 };
    expect(boundsIntersection(PAST_THE_LINE, envelope)).toEqual({ south: -46, west: 159.9, north: -25.98, east: 176.4 });
    expect(boundsIntersection(envelope, PAST_THE_LINE)).toEqual({ south: -46, west: 159.9, north: -25.98, east: 176.4 });
    // Reaching round to both sides, the common part is joined across the line, within the narrower box.
    const wide = { south: -50, west: -175, north: 0, east: 175 };
    expect(boundsIntersection(PAST_THE_LINE, wide)).toEqual({ ...PAST_THE_LINE, north: -25.98 });
    // The whole world shares all of it.
    expect(boundsIntersection({ south: -90, west: -180, north: 90, east: 180 }, PAST_THE_LINE)).toEqual(PAST_THE_LINE);
    // Two boxes across the line share the line.
    expect(boundsIntersection(PAST_THE_LINE, { south: -40, west: 175, north: -38, east: -170 }))
      .toEqual({ south: -40, west: 175, north: -38, east: -170 });
    expect(boundsIntersection(PAST_THE_LINE, { south: -40, west: 0, north: -38, east: 10 })).toBeNull();
  });

  it('cut boxes that keep off the line as before', () => {
    expect(boundsIntersection(
      { south: 47.3, west: 8.4, north: 47.5, east: 8.7 },
      { south: 47.35, west: 8.5, north: 47.6, east: 8.6 },
    )).toEqual({ south: 47.35, west: 8.5, north: 47.5, east: 8.6 });
  });

  it('are padded across the line, and to the whole world when that is wider', () => {
    // West of the line, padding takes in the far side.
    const padded = expandBounds({ south: -40, west: 170, north: -36, east: 179 }, 0.25);
    expect(padded.west).toBe(167.75);
    expect(padded.east).toBeCloseTo(-178.75, 9);
    expect(boundsContainPoint(padded, ...CHATHAM)).toBe(false);
    expect(boundsContainPoint(padded, -38, -179)).toBe(true);
    // East of it, the near side.
    const east = expandBounds({ south: -45, west: -179.6, north: -43, east: -177.6 }, 0.25);
    expect(east.west).toBeCloseTo(179.9, 9);
    expect(east.east).toBeCloseTo(-177.1, 9);
    expect(boundsContainPoint(east, -44, 179.95)).toBe(true);
    // Across it.
    const across = expandBounds(PAST_THE_LINE, 0.25);
    expect(across.west).toBeCloseTo(149.15, 9);
    expect(across.east).toBeCloseTo(-146.35, 9);
    expect(boundsContainBounds(across, PAST_THE_LINE)).toBe(true);
    // Round the world.
    expect(expandBounds({ south: -10, west: -170, north: 10, east: 170 }, 0.25)).toEqual({ south: -15, west: -180, north: 15, east: 180 });
    expect(expandBounds({ south: -10, west: -180, north: 10, east: 180 }, 1)).toEqual({ south: -30, west: -180, north: 30, east: 180 });
    // Away from the line, as before.
    expect(expandBounds({ south: 47.36, west: 8.52, north: 47.4, east: 8.56 }, 0.25)).toEqual({
      south: expect.closeTo(47.35, 9), west: expect.closeTo(8.51, 9), north: expect.closeTo(47.41, 9), east: expect.closeTo(8.57, 9),
    });
  });

  it('have their middle on the right side of the line', () => {
    const [lat, lng] = boundsCenter(PAST_THE_LINE);
    expect(lat).toBeCloseTo(-36.52, 9);
    expect(lng).toBeCloseTo(-178.6, 9);
    expect(boundsCenter({ south: -40, west: 170, north: -38, east: -176 })[1]).toBeCloseTo(177, 9);
    expect(boundsCenter({ south: 47, west: 8, north: 48, east: 9 })).toEqual([47.5, 8.5]);
  });
});

describe('a turned view across the line', () => {
  // Turned 45° around 181.4°E: Leaflet gives the corners of the screen in the copy of the world the map is in.
  const corners = [[-26, 170], [-36, 196], [-47, 181.4], [-36, 166]] as const;
  const viewport = { ...viewBounds(-47, 166, -26, 196), corners };

  it('holds what the screen shows, on either side of the line', () => {
    expect(viewportContainsPoint(viewport, -36.5, 179)).toBe(true);
    expect(viewportContainsPoint(viewport, -36.5, -178)).toBe(true);
    expect(viewportContainsPoint(viewport, ...AUCKLAND)).toBe(true);
  });

  it('leaves out what the turned screen does not show', () => {
    // In the box, outside the turned screen's corner.
    expect(viewportContainsPoint(viewport, -27, 167)).toBe(false);
    expect(viewportContainsPoint(viewport, -27, -165)).toBe(false);
  });

  it('holds the same in a copy of the world', () => {
    const copy = { ...viewport, corners: corners.map(([lat, lng]) => [lat, lng - 360] as const) };
    expect(viewportContainsPoint(copy, -36.5, 179)).toBe(true);
    expect(viewportContainsPoint(copy, -36.5, -178)).toBe(true);
    expect(viewportContainsPoint(copy, -27, -165)).toBe(false);
  });
});
