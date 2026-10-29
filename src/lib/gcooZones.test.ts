import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchGcooZones, gcooTownZones, type GcooZoneSource } from './gcooZones';
import { independentCollectableFeeds } from './scooterFeeds';

// Three towns as the catalog has them: Arlington's and Alexandria's boxes overlap around Four Mile Run.
const LOS_ANGELES = { feedId: 'us:gcoo_us_los_angeles', center: [34.0522, -118.2437] as [number, number],
  bounds: { south: 33.9755, north: 34.1245, west: -118.3866, east: -118.2067 } };
const ARLINGTON = { feedId: 'us:gcoo_us_arlington', center: [38.8816, -77.091] as [number, number],
  bounds: { south: 38.8298, north: 38.9436, west: -77.1832, east: -77.0309 } };
const ALEXANDRIA = { feedId: 'us:gcoo_us_alexandria', center: [38.8048, -77.0469] as [number, number],
  bounds: { south: 38.7789, north: 38.8564, west: -77.1578, east: -77.0213 } };
const TOWNS = [LOS_ANGELES, ARLINGTON, ALEXANDRIA];

/** A square about 100 m across south-west of [lat, lng], as GCOO's [lng, lat] points, closed. */
const square = (lat: number, lng: number, size = 0.001) =>
  [[lng, lat], [lng + size, lat], [lng + size, lat + size], [lng, lat + size], [lng, lat]];
const paths = (outer: number[][], inner: number[][][] = []) => ({ outer_coords: outer, inner_coords: inner });

// As GCOO's file has them on 29 October 2026, shrunk: a no-ride zone by the Pentagon, a slow zone in Old Town,
// no-parking over downtown Los Angeles with a hole where parking is allowed, and Venice's no-ride zone, in no
// town's box. The zone by Four Mile Run is in both Virginia boxes, nearer Alexandria's centre.
const FILE = {
  service_areas: [{ id: 1336, region_name: 'Arlington' }],
  geofence_areas: [
    { id: 697, region_id: 1336, zone_type: 'no_ride_zone', paths: paths(square(38.871, -77.056)) },
    { id: 575, region_id: 1136, zone_type: 'slow_zone', paths: paths(square(38.805, -77.043)) },
    { id: 576, region_id: 1136, zone_type: 'no_ride_zone', paths: paths(square(38.84, -77.06)) },
    { id: 12, region_id: 463, zone_type: 'no_ride_zone', paths: paths(square(33.984, -118.468)) },
    { id: 13, region_id: 1336, zone_type: 'discount_zone', paths: paths(square(38.88, -77.09)) },
    { id: 'x', region_id: 1336, zone_type: 'no_ride_zone', paths: paths(square(38.88, -77.09)) },
  ],
  no_parking_areas: [
    { id: 1204952, paths: paths(square(34.04, -118.25, 0.01), [square(34.044, -118.246)]) },
    // Open, as GCOO might send it: closed here as GeoJSON's are.
    { id: 1218405, paths: paths(square(38.876, -77.072).slice(0, 4)) },
    { id: 1218406, paths: paths([[-77.07, 38.87]]) },
  ],
  discount_areas: [],
  penalty_parking_areas: [],
};

describe('GCOO\'s zones', () => {
  afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

  it('gives each zone of the area file to the nearest town it reaches into, of its kind, with its holes', () => {
    const zones = gcooTownZones(FILE, TOWNS, 'gcoo');
    const kinds = (town: { feedId: string }) => zones.get(town.feedId)!.map(zone => [zone.id, zone.kind]);
    expect(kinds(ARLINGTON)).toEqual([
      ['us:gcoo_us_arlington:zone-697', 'noRide'], ['us:gcoo_us_arlington:no-parking-1218405', 'noParking'],
    ]);
    expect(kinds(ALEXANDRIA)).toEqual([['us:gcoo_us_alexandria:zone-575', 'slow'], ['us:gcoo_us_alexandria:zone-576', 'noRide']]);
    expect(kinds(LOS_ANGELES)).toEqual([['us:gcoo_us_los_angeles:no-parking-1204952', 'noParking']]);

    const [downtown] = zones.get(LOS_ANGELES.feedId)!;
    expect(downtown.provider).toBe('gcoo');
    expect(downtown.polygons).toHaveLength(1);
    expect(downtown.polygons[0]).toHaveLength(2);
    expect(downtown.polygons[0][1][0]).toEqual([34.044, -118.246]);
    expect(downtown.bounds).toEqual({ south: 34.04, west: -118.25, north: 34.05, east: -118.24 });
    expect(downtown.points).toBe(10);
    const [, open] = zones.get(ARLINGTON.feedId)!;
    expect(open.polygons[0][0]).toHaveLength(5);
    expect(open.polygons[0][0].at(-1)).toEqual(open.polygons[0][0][0]);
  });

  it('refuses a file without its zones', () => {
    expect(() => gcooTownZones({ service_areas: [] }, TOWNS, 'gcoo')).toThrow('Invalid GCOO area file');
    expect(() => gcooTownZones(null, TOWNS, 'gcoo')).toThrow('Invalid GCOO area file');
  });

  it('reads the gzipped file once an hour for all its towns, and again after a failure', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-10-29T14:00:00Z'));
    const source: GcooZoneSource = { gcooAreasUrl: 'https://region.gbike.io/us/test-hourly.json.gz', towns: TOWNS };
    const fetch = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockImplementation(async () => new Response(gzipSync(JSON.stringify(FILE)), { headers: { 'Content-Type': 'application/json' } }));
    await expect(fetchGcooZones(ARLINGTON.feedId, 'gcoo', source)).rejects.toThrow('HTTP 503');
    const [arlington, alexandria] = await Promise.all([
      fetchGcooZones(ARLINGTON.feedId, 'gcoo', source), fetchGcooZones(ALEXANDRIA.feedId, 'gcoo', source)]);
    expect(arlington.map(zone => zone.id)).toEqual(['us:gcoo_us_arlington:zone-697', 'us:gcoo_us_arlington:no-parking-1218405']);
    expect(alexandria).toHaveLength(2);
    expect(await fetchGcooZones('us:gcoo_us_memphis', 'gcoo', source)).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][0]).toBe(source.gcooAreasUrl);

    vi.setSystemTime(Date.parse('2026-10-29T15:00:01Z'));
    await fetchGcooZones(LOS_ANGELES.feedId, 'gcoo', source);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('reads the file as JSON when the fetch has already unzipped it, and refuses one too large', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(Response.json(FILE))
      .mockResolvedValueOnce(new Response(new Uint8Array(5_000_000)));
    const plain = { gcooAreasUrl: 'https://region.gbike.io/us/test-plain.json', towns: TOWNS };
    expect(await fetchGcooZones(LOS_ANGELES.feedId, 'gcoo', plain)).toHaveLength(1);
    const large = { gcooAreasUrl: 'https://region.gbike.io/us/test-large.json.gz', towns: TOWNS };
    await expect(fetchGcooZones(LOS_ANGELES.feedId, 'gcoo', large)).rejects.toThrow('size limit');
  });

  it('is the zone source of GCOO\'s American towns, and of no Korean one', () => {
    const feeds = independentCollectableFeeds().filter(feed => feed.provider === 'gcoo');
    const american = feeds.filter(feed => feed.zoneSource);
    expect(american.map(feed => feed.id).sort()).toEqual(TOWNS.map(town => town.feedId).sort());
    const source = american[0].zoneSource as GcooZoneSource;
    expect(source.gcooAreasUrl).toBe('https://region.gbike.io/us/all_polygons.json.gz');
    expect(source.towns).toEqual(expect.arrayContaining(TOWNS));
    expect(american.every(feed => feed.zoneSource === source)).toBe(true);
    expect(feeds.length).toBeGreaterThan(20);
  });
});
