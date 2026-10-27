import { describe, expect, it, vi } from 'vitest';
import { BirdIncompleteMapError, BirdMapReader, BirdUntrustedMapError, parseBirdMap, scanBirdBounds } from './bird-app-map.mjs';

const CELL = '-8771687093886779392';
const OTHER_CELL = '-8771686544130965504';
const LEGACY_CELL = '-8771688262117883904';
const session = { version: 1, deviceId: '00000000-0000-4000-8000-000000000000', accessToken: 'test.access.token' };
const location = { latitude: 30.2672, longitude: -97.7431 };
const bird = (n = 0, extra = {}) => ({ id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`,
  location, brand_id: 'df76d602-dd1a-4ce4-a64f-2e5dd8c6f845', vehicle_class: 'scooter', captive: false,
  area_key: '60B484B9D3131B81F462F0579E5187C2', battery_level: 60, estimated_range: 20_000, ...extra });
const payload = (birds = [], cells = [LEGACY_CELL]) => ({ birds, cell_ids: cells });
const json = value => new Response(JSON.stringify(value), { status: 200 });
function reader(fetcher) {
  let at = 0;
  const sleeps = [];
  const api = new BirdMapReader({ session, fetch: fetcher, now: () => at,
    sleep: async ms => { sleeps.push(ms); at += ms; } });
  return { api, sleeps, advance: ms => { at += ms; } };
}

describe('Bird map validity', () => {
  it('rejects synthetic vehicles and synthetic empty replies despite HTTP 200', () => {
    expect(() => parseBirdMap({ birds: [] })).toThrow(BirdUntrustedMapError);
    expect(() => parseBirdMap({ birds: [bird(0, { brand_id: undefined })] })).toThrow(BirdUntrustedMapError);
    expect(() => parseBirdMap(payload([bird(0, { brand_id: undefined })]))).toThrow(BirdUntrustedMapError);
    expect(parseBirdMap(payload())).toMatchObject({ vehicles: [], capped: false });
  });

  it('requires complete cell acknowledgement, including on an empty reply', () => {
    expect(parseBirdMap(payload([], [CELL]), [CELL]).vehicles).toEqual([]);
    expect(() => parseBirdMap(payload([], []), [CELL])).toThrow(BirdIncompleteMapError);
    expect(() => parseBirdMap(payload([], [CELL]), [CELL, OTHER_CELL])).toThrow(BirdIncompleteMapError);
    expect(() => parseBirdMap(payload([], [OTHER_CELL]), [CELL])).toThrow(BirdUntrustedMapError);
    expect(() => parseBirdMap(payload([bird(0, { cell_id: OTHER_CELL })], [CELL]), [CELL])).toThrow(BirdUntrustedMapError);
  });

  it('counts all candidates before filtering and rejects a capped cell even without the upstream flag', () => {
    const capped = Array.from({ length: 250 }, (_, i) => bird(i, { vehicle_class: 'bicycle' }));
    expect(parseBirdMap(payload(capped))).toMatchObject({ vehicles: [], capped: true, candidates: 250 });
    expect(() => parseBirdMap(payload(Array.from({ length: 1000 }, (_, i) => bird(i, { cell_id: CELL })), [CELL]), [CELL]))
      .toThrow(BirdIncompleteMapError);
    expect(parseBirdMap({ ...payload(), reached_response_limit: true }).capped).toBe(true);
  });

  it('rejects malformed identities, metadata and positions instead of dropping bad rows', () => {
    for (const bad of [bird(0, { location: { latitude: NaN, longitude: 0 } }), bird(0, { id: '' }),
      bird(0, { brand_id: 'different-brand' }), bird(0, { area_key: 'invalid' })]) {
      expect(() => parseBirdMap(payload([bad]))).toThrow(BirdUntrustedMapError);
    }
    expect(() => parseBirdMap(payload([bird(), bird()]))).toThrow(BirdUntrustedMapError);
    for (const cells of [['not-a-cell'], ['18446744073709551616'], [CELL, CELL]]) {
      expect(() => parseBirdMap(payload([], cells))).toThrow(BirdUntrustedMapError);
    }
  });
});

describe('Bird read-only transport', () => {
  it('uses the current client flow and spaces requests to both map paths', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(json(payload([bird()])))
      .mockResolvedValueOnce(json(payload([bird(0, { cell_id: CELL })], [CELL])));
    const { api, sleeps } = reader(fetcher);
    await api.nearby(location, 300);
    await api.cells(location, [CELL]);
    expect(sleeps).toEqual([5000]);
    const [url, init] = fetcher.mock.calls[1];
    expect(url).toBe('https://api-bird.prod.birdapp.com/bird/nearby-by-cells');
    expect(init).toMatchObject({ method: 'POST', redirect: 'error', headers: { 'App-Name': 'bird', 'App-Type': 'rider',
      Platform: 'android', Authorization: 'Bearer test.access.token', 'Device-Id': session.deviceId } });
    expect(JSON.parse(init.body)).toEqual({ map_center: location, cell_ids: [CELL] });
  });

  it('stops every map path after a synthetic response without changing identity or renewing', async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ birds: [] }));
    const { api } = reader(fetcher);
    await expect(api.nearby(location, 300)).rejects.toThrow(BirdUntrustedMapError);
    await expect(api.cells(location, [CELL])).rejects.toThrow('held off');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('honours longer Retry-After values and does not leak upstream bodies', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('private bearer token', { status: 429, headers: { 'Retry-After': '3600' } }));
    const { api, advance } = reader(fetcher);
    await expect(api.nearby(location, 300)).rejects.toThrow('Bird map HTTP 429');
    advance(16 * 60_000);
    await expect(api.nearby(location, 300)).rejects.toThrow('held off');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('rejects cells at the wrong level and refuses vehicle actions before fetching', async () => {
    const fetcher = vi.fn();
    const { api } = reader(fetcher);
    await expect(api.cells(location, [LEGACY_CELL])).rejects.toThrow('Invalid Bird cell query');
    await expect(api.request('/bird/chirp', location, {})).rejects.toThrow('Unsupported');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects out-of-radius data and incompatible map-cell strategies', async () => {
    const { api } = reader(vi.fn().mockResolvedValue(json(payload([bird(0, { location: { latitude: 40, longitude: -75 } })]))));
    await expect(api.nearby(location, 300)).rejects.toThrow(BirdUntrustedMapError);
    const incompatible = reader(vi.fn().mockResolvedValue(json({ cells: { view: { birds: { strategy: 'future', cell_ids: [CELL] } } } })));
    await expect(incompatible.api.cellsForBounds({ south: 30.26, west: -97.75, north: 30.27, east: -97.74 }))
      .rejects.toThrow(BirdUntrustedMapError);
  });
});

describe('Bird complete sweeps', () => {
  const box = { south: 30.266, west: -97.744, north: 30.268, east: -97.742 };
  const fakeReader = read => ({ now: () => 1000, requests: 0, async nearby(point, radius) {
    this.requests++; return read(this.requests, point, radius);
  } });

  it('keeps parent observations when narrower uncapped views omit them', async () => {
    const api = fakeReader(n => n === 1
      ? { capped: true, vehicles: [{ id: 'from-parent', lat: location.latitude, lng: location.longitude }] }
      : { capped: false, vehicles: [] });
    const result = await scanBirdBounds(api, box, { maxRequests: 5 });
    expect(result).toMatchObject({ requests: 5, cappedViews: 1, vehicles: [{ id: 'from-parent' }] });
  });

  it('cannot report success after running out of requests or hitting an unresolvable cap', async () => {
    const api = fakeReader(() => ({ capped: true, vehicles: [] }));
    await expect(scanBirdBounds(api, box, { maxRequests: 1 })).rejects.toThrow(BirdIncompleteMapError);
    expect(api.requests).toBe(1);
    const tiny = { south: 30.267, west: -97.7432, north: 30.2672, east: -97.743 };
    await expect(scanBirdBounds(fakeReader(() => ({ capped: true, vehicles: [] })), tiny)).rejects.toThrow(BirdIncompleteMapError);
  });

  it('does not turn a failed child request into a partial successful inventory', async () => {
    const api = fakeReader(n => {
      if (n > 1) throw new BirdUntrustedMapError();
      return { capped: true, vehicles: [{ id: 'parent', lat: location.latitude, lng: location.longitude }] };
    });
    await expect(scanBirdBounds(api, box)).rejects.toThrow(BirdUntrustedMapError);
  });
});
