import { boundsContainPoint, polygonContainsPoint } from '../src/lib/geo';
import type { MapBounds } from '../src/lib/types';

export const LIME_MAP_PROTOCOL = 'whole-service-local-nearest-v1';
export const LIME_QUERY_INTERVAL_MS = 5_000;
export const LIME_IDLE_INTERVAL_MS = 60 * 60_000;
export const LIME_TILE_GROUP_SIZE = 4;

export type LimeArea = [number, number][];
export function decodeLimeArea(encoded: string): LimeArea {
  if (typeof encoded !== 'string' || encoded.length > 500_000) throw new Error('Invalid Lime service outline');
  const points: LimeArea = [];
  let at = 0, lat = 0, lng = 0;
  function delta() {
    let value = 0, shift = 0, byte: number;
    do {
      if (at >= encoded.length || shift > 30) throw new Error('Invalid Lime service outline');
      byte = encoded.charCodeAt(at++) - 63;
      if (byte < 0 || byte > 63) throw new Error('Invalid Lime service outline');
      value |= (byte & 31) << shift;
      shift += 5;
    } while (byte >= 32);
    return value & 1 ? ~(value >>> 1) : value >>> 1;
  }
  while (at < encoded.length) {
    lat += delta(); lng += delta();
    if (Math.abs(lat) > 9_000_000 || Math.abs(lng) > 18_000_000) throw new Error('Invalid Lime service outline coordinates');
    points.push([lat / 100_000, lng / 100_000]);
  }
  if (points.length < 3) throw new Error('Lime service outline has no area');
  return points;
}
export function limeAreaBounds(areas: LimeArea[]): MapBounds {
  const points = areas.flat();
  if (!points.length) throw new Error('Lime has no scooter service area');
  const latitude = points.map(p => p[0]), longitude = points.map(p => p[1]);
  return { south: Math.min(...latitude), north: Math.max(...latitude), west: Math.min(...longitude), east: Math.max(...longitude) };
}
function segmentMeetsBox(a: [number, number], b: [number, number], box: MapBounds) {
  const dy = b[0] - a[0], dx = b[1] - a[1];
  let low = 0, high = 1;
  for (const [p, q] of [[-dx, a[1] - box.west], [dx, box.east - a[1]], [-dy, a[0] - box.south], [dy, box.north - a[0]]]) {
    if (p === 0) { if (q < 0) return false; }
    else {
      const t = q / p;
      if (p < 0) low = Math.max(low, t);
      else high = Math.min(high, t);
      if (low > high) return false;
    }
  }
  return true;
}
export function limeAreaMeetsBox(area: LimeArea, box: MapBounds) {
  return area.some(p => boundsContainPoint(box, ...p)) ||
    [[box.south, box.west], [box.south, box.east], [box.north, box.west], [box.north, box.east]]
      .some(([lat, lng]) => polygonContainsPoint(area, lat, lng)) ||
    area.some((p, i) => segmentMeetsBox(p, area[(i + 1) % area.length], box));
}

/** Wide, uncapped map requests still omit vehicles. Every service polygon needs local views. */
export function limeAreaTiles(areas: LimeArea[], sideM = 1500): MapBounds[] {
  const bounds = limeAreaBounds(areas);
  const latStep = sideM / 111_320;
  const lngStep = latStep / Math.max(Math.cos(bounds.south * Math.PI / 180), Math.cos(bounds.north * Math.PI / 180));
  const rows = Math.max(1, Math.ceil((bounds.north - bounds.south) / latStep));
  const columns = Math.max(1, Math.ceil((bounds.east - bounds.west) / lngStep));
  if (rows * columns > 20_000) throw new Error('Lime service area is too large for local map collection');
  const tiles: MapBounds[] = [];
  for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
    const box = { south: bounds.south + row * latStep, north: Math.min(bounds.north, bounds.south + (row + 1) * latStep),
      west: bounds.west + column * lngStep, east: Math.min(bounds.east, bounds.west + (column + 1) * lngStep) };
    if (areas.some(area => limeAreaMeetsBox(area, box))) tiles.push(box);
  }
  return tiles;
}
