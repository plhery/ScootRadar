// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { ROUTE_FIT_MAX_ZOOM, routeFit, type Frame } from '@/lib/walkRouteLayer';

type ScreenPoint = { x: number; y: number };

// A phone of 390 by 844: the search bar ends at 72, a card covers the map from 620 down.
const size = { x: 390, y: 844 };
const frame: Frame = { left: 12, top: 72, right: 378, bottom: 620 };
const map = { frame, size, zoom: 16, minZoom: 3, maxZoom: 20 };
const fit = (points: ScreenPoint[], options: Partial<typeof map> = {}) => routeFit({ ...map, ...options, points });

/** Where a point of the screen is once the map has zoomed about its middle, then moved `center` to the middle. */
function afterFit(point: ScreenPoint, fitted: { zoom: number; center: ScreenPoint }, zoom = map.zoom, screen = size) {
  const k = 2 ** (fitted.zoom - zoom);
  const s = { x: screen.x / 2, y: screen.y / 2 };
  return {
    x: s.x + (point.x - s.x) * k - (fitted.center.x - s.x) * k,
    y: s.y + (point.y - s.y) * k - (fitted.center.y - s.y) * k,
  };
}

function expectCentredInFrame(points: ScreenPoint[], fitted: { zoom: number; center: ScreenPoint } | null, view = map) {
  expect(fitted).not.toBeNull();
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const middle = { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
  const moved = afterFit(middle, fitted!, view.zoom, view.size);
  expect(moved.x).toBeCloseTo((view.frame.left + view.frame.right) / 2, 6);
  expect(moved.y).toBeCloseTo((view.frame.top + view.frame.bottom) / 2, 6);
}

describe('routeFit', () => {
  it('leaves the map alone when the way is in the frame and would not fill it much better', () => {
    expect(fit([{ x: 40, y: 120 }, { x: 300, y: 560 }])).toBeNull();
  });

  it('zooms in on a way that would fill the frame at least twice as well', () => {
    const points = [{ x: 120, y: 200 }, { x: 270, y: 450 }];
    const fitted = fit(points);
    expect(fitted?.zoom).toBe(17);
    expectCentredInFrame(points, fitted);
  });

  it('zooms in no closer than ROUTE_FIT_MAX_ZOOM, nor than the map allows', () => {
    const short = [{ x: 180, y: 300 }, { x: 200, y: 330 }];
    expect(ROUTE_FIT_MAX_ZOOM).toBe(18);
    expect(fit(short)?.zoom).toBe(ROUTE_FIT_MAX_ZOOM);
    expectCentredInFrame(short, fit(short));
    expect(fit(short, { maxZoom: 17 })?.zoom).toBe(17);
    // A way of one point.
    expect(fit([{ x: 195, y: 346 }], { zoom: 15 })?.zoom).toBe(ROUTE_FIT_MAX_ZOOM);
    expect(fit([{ x: 195, y: 346 }], { zoom: 18 })).toBeNull();
  });

  it('zooms out until a way that overflows the frame fits in it', () => {
    const points = [{ x: -300, y: -100 }, { x: 120, y: 400 }, { x: 500, y: 900 }];
    const fitted = fit(points);

    expect(fitted?.zoom).toBe(14);
    expectCentredInFrame(points, fitted);
    for (const point of points) {
      const moved = afterFit(point, fitted!);
      expect(moved.x).toBeGreaterThanOrEqual(frame.left);
      expect(moved.x).toBeLessThanOrEqual(frame.right);
      expect(moved.y).toBeGreaterThanOrEqual(frame.top);
      expect(moved.y).toBeLessThanOrEqual(frame.bottom);
    }
  });

  it('moves a way that fits but is partly under the card into the frame without zooming', () => {
    const points = [{ x: 100, y: 600 }, { x: 300, y: 800 }];
    const fitted = fit(points);
    expect(fitted?.zoom).toBe(16);
    expectCentredInFrame(points, fitted);
  });

  it('zooms out no further than the map allows', () => {
    const points = [{ x: -400_000, y: 100 }, { x: 400_000, y: 500 }];
    const fitted = fit(points, { minZoom: 12 });
    expect(fitted?.zoom).toBe(12);
    expectCentredInFrame(points, fitted);
  });

  it('centres the way in a frame that is off the middle of the screen', () => {
    // A phone on its side: the card is a column on the left.
    const landscape = { ...map, size: { x: 844, y: 390 }, frame: { left: 380, top: 70, right: 832, bottom: 378 } };
    const points = [{ x: 100, y: 50 }, { x: 600, y: 300 }];
    const fitted = routeFit({ ...landscape, points });
    expect(fitted?.zoom).toBe(15);
    expectCentredInFrame(points, fitted, landscape);
  });

  it('does not frame a way in less than 80 px of map', () => {
    const points = [{ x: -300, y: -100 }, { x: 500, y: 900 }];
    expect(fit(points, { frame: { ...frame, bottom: frame.top + 79 } })).toBeNull();
    expect(fit(points, { frame: { ...frame, right: frame.left + 79 } })).toBeNull();
    expect(fit(points, { frame: { ...frame, bottom: frame.top + 80 } })).not.toBeNull();
    expect(fit([])).toBeNull();
  });
});
