// @vitest-environment jsdom
import L from 'leaflet';
import '@tomickigrzegorz/leaflet-rotate';
import { describe, expect, it } from 'vitest';
import { viewBounds } from '@/lib/geo';
import { scooterQueryKey, viewportFetchBounds } from '@/lib/scooterDataState';
import { startQuery, startViewBounds } from '@/lib/useFirstScooters';

/** The view a Leaflet map made as MapComponent makes it reports, north up. */
function leafletView(center: [number, number], zoom: number, width: number, height: number) {
  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { value: width });
  Object.defineProperty(container, 'clientHeight', { value: height });
  document.body.appendChild(container);
  const map = L.map(container, { center, zoom, zoomControl: false, attributionControl: false, rotate: true });
  const bounds = map.getBounds();
  map.remove();
  container.remove();
  return viewBounds(bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast());
}

describe('startViewBounds', () => {
  // A link's place at street level on a Pixel 7 and an iPhone; a time zone's city on a laptop, a tablet and a
  // window of odd size; Auckland, Anchorage and a place by the date line.
  const starts: [[number, number], number, number, number][] = [
    [[47.3769, 8.5417], 16, 412, 839],
    [[47.3769, 8.5417], 16, 393, 659],
    [[48.8566, 2.3522], 13, 1440, 900],
    [[59.9139, 10.7522], 13, 820, 1180],
    [[40.7128, -74.006], 16, 1001, 777],
    [[-36.8485, 174.7633], 13, 375, 667],
    [[61.2181, -149.9003], 16, 414, 896],
    [[-16.5, 179.99], 13, 800, 600],
  ];

  it('is the view a map just made there reports, so the first request has the key of the map\'s first', () => {
    for (const [center, zoom, width, height] of starts) {
      const view = leafletView(center, zoom, width, height);
      expect(startViewBounds(center, zoom, { width, height })).toEqual(view);
      expect(scooterQueryKey(startQuery(center, zoom, { width, height })))
        .toBe(scooterQueryKey({ bounds: viewportFetchBounds(view, zoom), zoom }));
    }
  });

  it('is another key for a map of another size, which the first load then does not take', () => {
    const center: [number, number] = [47.3769, 8.5417];
    expect(scooterQueryKey(startQuery(center, 16, { width: 412, height: 839 })))
      .not.toBe(scooterQueryKey(startQuery(center, 16, { width: 412, height: 780 })));
  });
});
