import { beforeEach, describe, expect, it, vi } from 'vitest';
import { providersForViewport } from './catalogCoverage';
import { forgetAnnouncement } from './maintenance';
import { issueMapPass, MAP_PASS_COOKIE } from './mapPass';
import { proxyScooterSnapshot, type LastGoodStore } from './scooterProxy';

const env = { SCOOTER_SNAPSHOT_API_TOKEN: 'test-service-token', SCOOTER_SNAPSHOT_API_URL: 'https://cache.example',
  SCOOTER_API_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) } };
// A browser's user agent, which the Worker answers wherever passes are signed (isBrowserUserAgent).
const SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.1 Safari/605.1.15';
const request = () => new Request('https://map.example/api/scooters?south=45.72&west=4.79&north=45.8&east=4.9&zoom=13');

describe('edge snapshot proxy', () => {
  it('forwards only a bounded valid ephemeral view header', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ vehicles: [] }));
    for (const value of ['12345678-1234-1234-1234-123456789abc.2', 'invalid', '12345678-1234-1234-1234-123456789abc.99999999999999999999']) {
      const req = request(); req.headers.set('X-Scooter-View', value);
      await proxyScooterSnapshot(req, env);
      const forwarded = new Headers(fetcher.mock.lastCall?.[1]?.headers);
      expect(forwarded.get('X-Scooter-View')).toBe(value.endsWith('.2') ? value : null);
    }
  });
  it('answers unsupported empty places even during an origin outage', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const response = await proxyScooterSnapshot(new Request('https://map.example/api/scooters?south=43&west=1&north=43.1&east=1.1&zoom=15'), env);
    expect(response.status).toBe(200);
    const body = await response.json() as { meta: { totalVehicles: number } };
    expect(body.meta.totalVehicles).toBe(0);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('uses one cache request and preserves freshness headers', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ vehicles: [] }, { headers: { 'Cache-Control': 'private, no-store', 'X-Scooter-Public-Cache-Control': 'public, max-age=30', 'Server-Timing': 'read;dur=0.3, filter;dur=1.2, serialise;dur=0.8' } }));
    const response = await proxyScooterSnapshot(request(), env);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=30');
    // The cache's steps, then the Worker's wait for them.
    expect(response.headers.get('Server-Timing')).toMatch(/^read;dur=0\.3, filter;dur=1\.2, serialise;dur=0\.8, origin;dur=\d+\.\d$/);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(String(fetcher.mock.calls[0][0])).toContain('https://cache.example/api/scooters?');
  });

  it('returns a retryable 503 that says the server is down when the origin does not answer', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await proxyScooterSnapshot(request(), env);
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(response.headers.get('X-Scooter-Origin')).toBe('down');
    expect(response.headers.has('X-Scooter-Back-Around')).toBe(false);
    expect(await response.json()).toEqual({ error: 'Scooter data is temporarily unavailable. Please try again shortly.',
      maintenance: { planned: false, mode: null, since: null, backAround: null } });
    expect(logged.mock.calls.map(([line]) => JSON.parse(line))).toEqual([{ event: 'scooter_origin_failure', error: 'TimeoutError', down: true }]);
  });

  it('logs the status of an origin error without the request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Scooter data is temporarily unavailable.' }, { status: 503 }));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await proxyScooterSnapshot(request(), env)).status).toBe(503);
    expect(logged.mock.calls.map(([line]) => JSON.parse(line))).toEqual([{ event: 'scooter_origin_failure', status: 503 }]);
  });

  it('forwards a view across the 180° line to the cache as it was asked', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ vehicles: [] }));
    const search = '?south=-47.06&west=159.9&north=-25.98&east=-157.1&zoom=6';
    const response = await proxyScooterSnapshot(new Request(`https://map.example/api/scooters${search}`), env);
    expect(response.status).toBe(200);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(String(fetcher.mock.calls[0][0])).toBe(`https://cache.example/api/scooters${search}`);
  });

  it('asks the cache for the zones of the map\'s layer, and answers none outside the places it covers', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ zones: [] },
      { headers: { 'X-Scooter-Public-Cache-Control': 'public, max-age=300' } }));
    const zones = await proxyScooterSnapshot(new Request('https://map.example/api/zones?south=47.36&west=8.53&north=47.38&east=8.55&zoom=15'), env);
    expect(zones.headers.get('Cache-Control')).toBe('public, max-age=300');
    expect(String(fetcher.mock.calls[0][0])).toBe('https://cache.example/api/zones?south=47.36&west=8.53&north=47.38&east=8.55&zoom=15');
    const nowhere = await proxyScooterSnapshot(new Request('https://map.example/api/zones?south=43&west=1&north=43.1&east=1.1&zoom=15'), env);
    expect(await nowhere.json()).toMatchObject({ zones: [], meta: { pending: false, truncated: false } });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it('rejects invalid bounds before any origin call', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch');
    const response = await proxyScooterSnapshot(new Request('https://map.example/api/scooters?zoom=NaN'), env);
    expect(response.status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
});

it('fails closed without an origin credential and forwards only a trusted client IP', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ vehicles: [] }));
  expect((await proxyScooterSnapshot(request(), { ...env, SCOOTER_SNAPSHOT_API_TOKEN: undefined })).status).toBe(503);
  expect(fetcher).not.toHaveBeenCalled();
  const req = new Request(request(), { headers: { 'cf-connecting-ip': '192.0.2.1', 'X-Scooter-Client-IP': 'spoofed' } });
  await proxyScooterSnapshot(req, env);
  expect(fetcher).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({
    redirect: 'manual', headers: { Accept: 'application/json', Authorization: 'Bearer test-service-token', 'X-Scooter-Client-IP': '192.0.2.1',
      'X-Scooter-Client': 'other', 'X-Scooter-Agent': 'browser', 'X-Scooter-Referrer': 'none' },
  }));
  // An IPv6 client as its /64, which the cache's limits and count of visitors go by.
  await proxyScooterSnapshot(new Request(request(), { headers: { 'cf-connecting-ip': '2001:db8:12:3400:a1b2:c3d4:e5f6:1' } }), env);
  expect(fetcher).toHaveBeenLastCalledWith(expect.any(URL), expect.objectContaining({
    headers: expect.objectContaining({ 'X-Scooter-Client-IP': '2001:db8:12:3400::' }) }));
});

it('tells the cache who asks, from a pass, a view or an app\'s user agent, and asks the maps for their pass', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ vehicles: [] }));
  const passes = { ...env, MAP_PASS_SECRET: 'pass-secret', TURNSTILE_SECRET_KEY: 'turnstile-secret' };
  const pass = await issueMapPass('pass-secret', '192.0.2.1');
  const ask = async (headers: Record<string, string>, environment: typeof env = passes, url = request().url) => {
    const response = await proxyScooterSnapshot(new Request(url, { headers: { 'cf-connecting-ip': '192.0.2.1', 'User-Agent': SAFARI, ...headers } }), environment);
    return { client: new Headers(fetcher.mock.lastCall?.[1]?.headers).get('X-Scooter-Client'), pass: response.headers.get('X-Scooter-Pass') };
  };
  const view = { 'X-Scooter-View': '12345678-1234-1234-1234-123456789abc.2' };
  expect(await ask({ ...view, Cookie: `${MAP_PASS_COOKIE}=${pass}` })).toEqual({ client: 'verified', pass: null });
  expect(await ask(view)).toEqual({ client: 'map', pass: 'none' });
  expect(await ask({ 'User-Agent': 'ScootRadar/2437 CFNetwork/3896.200.61 Darwin/27.2.0' })).toEqual({ client: 'app', pass: 'none' });
  // A pass of another network, or forged, is none.
  expect(await ask({ ...view, Cookie: `${MAP_PASS_COOKIE}=${pass}`, 'cf-connecting-ip': '192.0.2.2' })).toEqual({ client: 'map', pass: 'none' });
  const forged = `${pass.slice(0, -1)}${pass.endsWith('A') ? 'B' : 'A'}`;
  expect(await ask({ ...view, Cookie: `${MAP_PASS_COOKIE}=${forged}` })).toEqual({ client: 'map', pass: 'none' });
  // An app's pass comes in the header, as the apps hold no cookie.
  const app = { ...view, 'User-Agent': 'okhttp/5.5.1' };
  expect(await ask({ ...app, 'X-Scooter-Pass': pass })).toEqual({ client: 'verified', pass: null });
  expect(await ask({ ...app, 'X-Scooter-Pass': forged })).toEqual({ client: 'map', pass: 'none' });
  // And whether it is one of our apps or a browser, by its user agent: the cache holds only browsers to the allowance.
  expect(new Headers(fetcher.mock.lastCall?.[1]?.headers).get('X-Scooter-Agent')).toBe('app');
  await ask(view);
  expect(new Headers(fetcher.mock.lastCall?.[1]?.headers).get('X-Scooter-Agent')).toBe('browser');
  expect(await ask({ ...app, 'X-Scooter-Pass': pass, 'cf-connecting-ip': '192.0.2.2' })).toEqual({ client: 'map', pass: 'none' });
  // No pass is asked for where none can be given, nor for the zones.
  expect(await ask(view, env)).toEqual({ client: 'map', pass: null });
  expect(await ask(view, { ...passes, TURNSTILE_SECRET_KEY: undefined } as typeof env)).toEqual({ client: 'map', pass: null });
  // Turnstile checks browsers alone: without its secret, the apps, which prove themselves another way, are still asked.
  const noTurnstile = { ...passes, TURNSTILE_SECRET_KEY: undefined } as typeof env;
  expect(await ask({ ...view, 'User-Agent': 'ScootRadar/2437 CFNetwork/3896.200.61 Darwin/27.2.0' }, noTurnstile))
    .toEqual({ client: 'map', pass: 'none' });
  expect(await ask({ ...app }, noTurnstile)).toEqual({ client: 'map', pass: 'none' });
  expect(await ask({ ...app }, { ...noTurnstile, MAP_PASS_SECRET: undefined } as typeof env)).toEqual({ client: 'map', pass: null });
  expect((await ask(view, passes, 'https://map.example/api/zones?south=47.36&west=8.53&north=47.38&east=8.55&zoom=15')).pass).toBeNull();
});

it('tells the cache what kind of referrer a request carries, never the referrer itself', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ vehicles: [] }));
  const sent = async (referrer?: string) => {
    await proxyScooterSnapshot(new Request(request(), { headers: { 'cf-connecting-ip': '192.0.2.1',
      ...(referrer === undefined ? {} : { Referer: referrer }) } }), env);
    const headers = new Headers(fetcher.mock.lastCall?.[1]?.headers);
    expect(headers.has('Referer')).toBe(false);
    expect([...headers.values()].some(value => value.includes('/map?'))).toBe(false);
    return headers.get('X-Scooter-Referrer');
  };
  // The map's own requests carry its page in full (Referrer-Policy: strict-origin-when-cross-origin).
  expect(await sent('https://scootradar.com/map?lat=47.37&lng=8.54&z=15')).toBe('own');
  expect(await sent('https://scootradar.com/')).toBe('own');
  expect(await sent('https://scootradar.com:443/de')).toBe('own');
  // Another site, another of our hosts, a look-alike, plain HTTP or what is no address: other.
  expect(await sent('https://example.com/map?lat=47.37&lng=8.54&z=15')).toBe('other');
  expect(await sent('https://www.scootradar.com/')).toBe('other');
  expect(await sent('https://scootradar.com.example/')).toBe('other');
  expect(await sent('http://scootradar.com/')).toBe('other');
  expect(await sent('scootradar.com')).toBe('other');
  // None, as the apps send, or empty.
  expect(await sent()).toBe('none');
  expect(await sent('')).toBe('none');
});

it('rejects an origin redirect without forwarding it to clients or following it with the credential', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, {
    status: 302, headers: { Location: 'https://unexpected.example' },
  }));
  const response = await proxyScooterSnapshot(request(), env);
  expect(response.status).toBe(503);
  expect(response.headers.has('Location')).toBe(false);
  expect(fetcher).toHaveBeenCalledOnce();
  expect(fetcher).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({ redirect: 'manual' }));
});

describe('last good answer', () => {
  const memory = () => {
    const entries = new Map<string, Response>();
    const pending: Promise<unknown>[] = [];
    const store: LastGoodStore = {
      cache: { match: async key => entries.get(key)?.clone(), put: async (key, response) => { entries.set(key, response); } },
      waitUntil: promise => { pending.push(promise); },
    };
    return { entries, store, settled: () => Promise.all(pending) };
  };
  const answer = (meta: Record<string, unknown>, policy = 'public, max-age=30') => Response.json({ vehicles: [{ id: 'a' }], meta },
    { headers: { 'Cache-Control': 'private, no-store', 'X-Scooter-Public-Cache-Control': policy } });

  it('gives the last good answer again, marked stale, when the origin fails', async () => {
    const { entries, store, settled } = memory();
    // Kept naming the app late then: given again, all of it is.
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(answer({ stale: true,
      staleProviders: { ryde: '2026-10-21T23:50:00Z' }, generatedAt: '2026-10-22T00:00:00Z' }));
    expect((await proxyScooterSnapshot(request(), env, store)).status).toBe(200);
    await settled();
    // And for its area: the zoom's tile of its centre (Lyon's at zoom 13).
    expect([...entries.keys()]).toEqual(['https://map.example/api/scooters?east=4.9&north=45.8&south=45.72&west=4.79&zoom=13',
      'https://map.example/__last-good-area/13/4206/2922?zoom=13']);
    expect(entries.values().next().value?.headers.get('Cache-Control')).toBe('public, max-age=900');
    expect([...entries.values()][1].headers.get('X-Scooter-Bounds')).toBe('45.72,4.79,45.8,4.9');

    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetcher.mockResolvedValueOnce(Response.json({ error: 'Scooter data is temporarily unavailable.' }, { status: 503 }));
    // The same view, its parameters in another order.
    const stale = await proxyScooterSnapshot(new Request('https://map.example/api/scooters?zoom=13&south=45.72&west=4.79&north=45.8&east=4.9'), env, store);
    expect(stale.status).toBe(200);
    expect(await stale.json()).toEqual({ vehicles: [{ id: 'a' }], meta: { stale: true, generatedAt: '2026-10-22T00:00:00Z' } });
    expect(stale.headers.get('Cache-Control')).toBe('private, no-store');
    expect(stale.headers.get('X-Mobility-Data-Status')).toBe('stale');
    expect(stale.headers.get('X-Scooter-Last-Good-Age')).toBe('0');
    // The cache's own 503, every feed of the view failing: the operators', not maintenance.
    expect(stale.headers.has('X-Scooter-Origin')).toBe(false);
    expect(logged.mock.calls.map(([line]) => JSON.parse(line))).toEqual([{ event: 'scooter_origin_failure', status: 503, lastGoodAge: 0 }]);
  });

  it("gives the licences' notice of the data it kept again with it", async () => {
    const { store, settled } = memory();
    // An Oslo street view: Entur's data, under NLOD, whose notice goes with it, fresh or kept (week review of 24
    // November 2026, W2).
    const oslo = () => new Request('https://map.example/api/scooters?south=59.91&west=10.73&north=59.92&east=10.76&zoom=16');
    const notice = 'Contains data under the Norwegian licence for Open Government data (NLOD) made available by Entur; All sources and licences: https://github.com/plhery/ScootRadar/blob/main/DATA_SOURCES.md';
    const fresh = answer({ truncated: false, mode: 'vehicles' });
    fresh.headers.set('X-Mobility-Data-Source', notice);
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(fresh);
    expect((await proxyScooterSnapshot(oslo(), env, store)).headers.get('X-Mobility-Data-Source')).toBe(notice);
    await settled();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetcher.mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'));
    const kept = await proxyScooterSnapshot(oslo(), env, store);
    expect(kept.status).toBe(200);
    expect(kept.headers.get('X-Mobility-Data-Status')).toBe('stale');
    expect(kept.headers.get('X-Mobility-Data-Source')).toBe(notice);
    // A neighbour's view given it too.
    const inside = await proxyScooterSnapshot(new Request('https://map.example/api/scooters?south=59.912&west=10.74&north=59.918&east=10.75&zoom=16'), env, store);
    expect(inside.status).toBe(200);
    expect(inside.headers.get('X-Mobility-Data-Source')).toBe(notice);
    // One kept without a notice, as by a Worker before, or from a cache that sets none, is given without.
    const { store: bare, settled: bareSettled } = memory();
    fetcher.mockResolvedValueOnce(answer({ truncated: false }));
    await proxyScooterSnapshot(oslo(), env, bare);
    await bareSettled();
    expect((await proxyScooterSnapshot(oslo(), env, bare)).headers.has('X-Mobility-Data-Source')).toBe(false);
  });

  it('forwards a range minimum to the cache and keeps its answer apart from that of the same view without one', async () => {
    const { entries, store, settled } = memory();
    const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => answer({ generatedAt: '2026-10-22T00:00:00Z' }));
    const ranged = 'https://map.example/api/scooters?south=45.72&west=4.79&north=45.8&east=4.9&zoom=13&minRange=4828';
    await proxyScooterSnapshot(new Request(ranged), env, store);
    await proxyScooterSnapshot(request(), env, store);
    await settled();
    expect(String(fetcher.mock.calls[0][0])).toBe('https://cache.example/api/scooters?south=45.72&west=4.79&north=45.8&east=4.9&zoom=13&minRange=4828');
    expect([...entries.keys()]).toEqual([
      'https://map.example/api/scooters?east=4.9&minRange=4828&north=45.8&south=45.72&west=4.79&zoom=13',
      'https://map.example/__last-good-area/13/4206/2922?minRange=4828&zoom=13',
      'https://map.example/api/scooters?east=4.9&north=45.8&south=45.72&west=4.79&zoom=13',
      'https://map.example/__last-good-area/13/4206/2922?zoom=13',
    ]);
    // One the cache could not take is refused here.
    expect((await proxyScooterSnapshot(new Request(`${request().url}&minRange=5.5`), env, store)).status).toBe(400);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('keeps the zones for a day, and gives them stale when the origin times out', async () => {
    const { store, settled } = memory();
    const now = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-22T00:00:00Z'));
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({ zones: [{ id: 'z' }], meta: { pending: false } },
      { headers: { 'X-Scooter-Public-Cache-Control': 'public, max-age=300' } }));
    const zones = () => new Request('https://map.example/api/zones?south=47.36&west=8.53&north=47.38&east=8.55&zoom=15');
    await proxyScooterSnapshot(zones(), env, store);
    await settled();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetcher.mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'));
    now.mockReturnValue(Date.parse('2026-10-22T20:00:00Z'));
    const stale = await proxyScooterSnapshot(zones(), env, store);
    // Unavailable: the maps keep them drawn, say the area's zones are not known now and ask again, as for a feed the
    // cache could not read.
    expect(await stale.json()).toEqual({ zones: [{ id: 'z' }], meta: { pending: false, stale: true, unavailable: true } });
    expect(stale.headers.get('X-Scooter-Last-Good-Age')).toBe('72000');
    now.mockReturnValue(Date.parse('2026-10-23T00:00:01Z'));
    expect((await proxyScooterSnapshot(zones(), env, store)).status).toBe(503);
  });

  it('gives no scooters older than the map shows', async () => {
    const { store, settled } = memory();
    const now = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-22T00:00:00Z'));
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(answer({ stale: false }));
    await proxyScooterSnapshot(request(), env, store);
    await settled();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetcher.mockRejectedValue(new TypeError('Network connection lost.'));
    now.mockReturnValue(Date.parse('2026-10-22T00:15:00Z'));
    expect((await proxyScooterSnapshot(request(), env, store)).status).toBe(200);
    now.mockReturnValue(Date.parse('2026-10-22T00:15:01Z'));
    const expired = await proxyScooterSnapshot(request(), env, store);
    expect(expired.status).toBe(503);
    expect(expired.headers.get('Retry-After')).toBe('30');
  });

  it("keeps an answer holding Bird's, Spin's or Bolt's data no longer than the cache allows, and says so to no browser", async () => {
    const { entries, store, settled } = memory();
    const now = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-22T00:00:00Z'));
    const capped = (seconds: string) => {
      const response = answer({ stale: false });
      response.headers.set('X-Scooter-Keep-Seconds', seconds);
      return response;
    };
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(capped('120'));
    const fresh = await proxyScooterSnapshot(request(), env, store);
    expect(fresh.headers.has('X-Scooter-Keep-Seconds')).toBe(false);
    expect(fresh.headers.get('Cache-Control')).toBe('public, max-age=30');
    await settled();
    const stored = entries.values().next().value!;
    expect(stored.headers.get('Cache-Control')).toBe('public, max-age=120');
    expect(stored.headers.get('X-Scooter-Keep-Seconds')).toBe('120');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    fetcher.mockRejectedValue(new TypeError('Network connection lost.'));
    now.mockReturnValue(Date.parse('2026-10-22T00:02:00Z'));
    const stale = await proxyScooterSnapshot(request(), env, store);
    expect(stale.status).toBe(200);
    expect(stale.headers.has('X-Scooter-Keep-Seconds')).toBe(false);
    // Past the limit stored with it, though the scooters' 15 minutes are not.
    now.mockReturnValue(Date.parse('2026-10-22T00:02:01Z'));
    expect((await proxyScooterSnapshot(request(), env, store)).status).toBe(503);

    // An answer it may not keep at all, or with a limit that makes no sense, is not kept.
    entries.clear();
    fetcher.mockReset();
    fetcher.mockResolvedValueOnce(capped('0')).mockResolvedValueOnce(capped('soon')).mockResolvedValueOnce(capped('-5'));
    for (let i = 0; i < 3; i++) expect((await proxyScooterSnapshot(request(), env, store)).status).toBe(200);
    await settled();
    expect(entries.size).toBe(0);
  });

  it('keeps an answer up to 15 minutes, as before, from a cache that sets no limit', async () => {
    const { entries, store, settled } = memory();
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(answer({ stale: false }));
    await proxyScooterSnapshot(request(), env, store);
    await settled();
    const stored = entries.values().next().value!;
    expect(stored.headers.get('Cache-Control')).toBe('public, max-age=900');
    // One kept by a Worker that set no limit is read as before.
    stored.headers.delete('X-Scooter-Keep-Seconds');
    const now = vi.spyOn(Date, 'now').mockReturnValue(Number(stored.headers.get('X-Scooter-Stored-At')) + 900_000);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network connection lost.'));
    expect((await proxyScooterSnapshot(request(), env, store)).status).toBe(200);
    now.mockReturnValue(Number(stored.headers.get('X-Scooter-Stored-At')) + 901_000);
    expect((await proxyScooterSnapshot(request(), env, store)).status).toBe(503);
  });

  it('keeps only answers the public may keep, and none of another view', async () => {
    const { entries, store, settled } = memory();
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(answer({ refreshing: true }, 'no-store'))
      .mockResolvedValueOnce(Response.json({ error: 'Invalid scooter search parameters' }, { status: 400 }))
      .mockResolvedValueOnce(answer({ stale: false }))
      .mockResolvedValue(new Response(null, { status: 502 }));
    await proxyScooterSnapshot(request(), env, store);
    expect((await proxyScooterSnapshot(request(), env, store)).status).toBe(400);
    await settled();
    expect(entries.size).toBe(0);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await proxyScooterSnapshot(request(), env, store);
    await settled();
    const elsewhere = new Request('https://map.example/api/scooters?south=45.72&west=4.79&north=45.8&east=4.91&zoom=13');
    expect((await proxyScooterSnapshot(elsewhere, env, store)).status).toBe(503);
    expect((await proxyScooterSnapshot(request(), env, store)).status).toBe(200);
  });
});

describe('the server down', () => {
  const memory = () => {
    const entries = new Map<string, Response>();
    const pending: Promise<unknown>[] = [];
    const store: LastGoodStore = {
      cache: { match: async key => entries.get(key)?.clone(), put: async (key, response) => { entries.set(key, response); } },
      waitUntil: promise => { pending.push(promise); },
    };
    return { entries, store, settled: () => Promise.all(pending) };
  };
  const answer = (meta: Record<string, unknown>) => Response.json({ vehicles: [{ id: 'a' }], meta },
    { headers: { 'Cache-Control': 'private, no-store', 'X-Scooter-Public-Cache-Control': 'public, max-age=30' } });
  const scooters = (search: string) => new Request(`https://map.example/api/scooters?${search}`);
  const announced = (values: Record<string, unknown>) => ({ ...env, MAINTENANCE: { get: vi.fn(async (key: string) => values[key] ?? null) } });

  beforeEach(() => {
    forgetAnnouncement();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it.each([
    ['the tunnel gone (530)', () => new Response('error code: 1033', { status: 530 })],
    ['no container behind the proxy (502)', () => new Response('Bad Gateway', { status: 502 })],
    ['the proxy with no healthy container (503)', () => new Response('Service Unavailable', { status: 503 })],
    ['the cache warming up after a start', () => new Response('{"error":"Scooter data is warming up."}', { status: 503, headers: { 'Retry-After': '5' } })],
    ['no answer at all', () => { throw new TypeError('Network connection lost.'); }],
  ])('says so for %s', async (_, origin) => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => origin());
    const response = await proxyScooterSnapshot(request(), env);
    expect(response.status).toBe(503);
    expect(response.headers.get('X-Scooter-Origin')).toBe('down');
  });

  it.each([
    ['every feed of the view failing', () => new Response('{"error":"Scooter data is temporarily unavailable."}', { status: 503 })],
    ['an error of the cache', () => new Response('{"error":"Scooter data is temporarily unavailable."}', { status: 500 })],
    ['a refused credential', () => new Response('{}', { status: 401 })],
  ])('says nothing of maintenance for %s', async (_, origin) => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => origin());
    const response = await proxyScooterSnapshot(request(), env);
    expect(response.status).toBe(503);
    expect(response.headers.has('X-Scooter-Origin')).toBe(false);
    expect(await response.json()).not.toHaveProperty('maintenance');
  });

  it('marks the last good answer it gives while the server is down', async () => {
    const { store, settled } = memory();
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(answer({ stale: false, truncated: false }));
    expect((await proxyScooterSnapshot(request(), env, store)).headers.has('X-Scooter-Origin')).toBe(false);
    await settled();
    fetcher.mockResolvedValue(new Response('error code: 1033', { status: 530 }));
    const stale = await proxyScooterSnapshot(request(), env, store);
    expect(stale.status).toBe(200);
    expect(stale.headers.get('X-Scooter-Origin')).toBe('down');
    expect(stale.headers.get('Retry-After')).toBe('30');
    expect(stale.headers.get('X-Mobility-Data-Status')).toBe('stale');
  });

  it('gives what was announced, and asks to be asked again before the time given, two minutes apart at most', async () => {
    const now = Date.parse('2026-11-18T22:05:00Z');
    vi.spyOn(Date, 'now').mockReturnValue(now);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('error code: 1033', { status: 530 }));
    const planned = announced({ all: { since: '2026-11-18T22:00:00Z', backAround: '2026-11-18T22:20:00Z' } });
    const response = await proxyScooterSnapshot(request(), planned);
    expect(response.headers.get('X-Scooter-Back-Around')).toBe('2026-11-18T22:20:00.000Z');
    expect(response.headers.get('Retry-After')).toBe('120');
    expect((await response.json() as { maintenance: unknown }).maintenance).toEqual({ planned: true, mode: 'soft',
      since: '2026-11-18T22:00:00.000Z', backAround: '2026-11-18T22:20:00.000Z' });
    // Its own key too; the later of the two is given, read again after half a minute.
    forgetAnnouncement();
    const soon = announced({ all: { backAround: '2026-11-18T22:05:40Z' } });
    expect((await proxyScooterSnapshot(request(), soon)).headers.get('Retry-After')).toBe('40');
    forgetAnnouncement();
    const both = announced({ all: { backAround: '2026-11-18T22:05:40Z' }, scootradar: { backAround: '2026-11-18T22:10:00Z' } });
    expect((await proxyScooterSnapshot(request(), both)).headers.get('X-Scooter-Back-Around')).toBe('2026-11-18T22:10:00.000Z');
    // A namespace that fails announces nothing, and the server is asked as ever.
    forgetAnnouncement();
    const failing = { ...env, MAINTENANCE: { get: vi.fn(async () => { throw new Error('KV unavailable'); }) } };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(answer({ stale: false }));
    expect((await proxyScooterSnapshot(request(), failing)).status).toBe(200);
  });

  it('leaves the server alone once maintenance announced hard starts, and gives what is kept', async () => {
    const { store, settled } = memory();
    const now = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-18T21:59:59Z'));
    const hard = announced({ all: { since: '2026-11-18T22:00:00Z', backAround: '2026-11-18T22:20:00Z', mode: 'hard' } });
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(answer({ stale: false, truncated: false }));
    // Before its start, it only words the notice.
    expect((await proxyScooterSnapshot(request(), hard, store)).status).toBe(200);
    await settled();
    expect(fetcher).toHaveBeenCalledOnce();
    now.mockReturnValue(Date.parse('2026-11-18T22:00:01Z'));
    const stale = await proxyScooterSnapshot(request(), hard, store);
    expect(stale.status).toBe(200);
    expect(stale.headers.get('X-Scooter-Origin')).toBe('down');
    expect(stale.headers.get('X-Scooter-Back-Around')).toBe('2026-11-18T22:20:00.000Z');
    const elsewhere = await proxyScooterSnapshot(scooters('south=47.36&west=8.53&north=47.38&east=8.55&zoom=15'), hard, store);
    expect(elsewhere.status).toBe(503);
    expect(await elsewhere.json()).toMatchObject({ maintenance: { planned: true, mode: 'hard' } });
    expect(fetcher).toHaveBeenCalledOnce();
    // Switched off, the server is asked again (once the isolate reads it again).
    hard.MAINTENANCE.get.mockResolvedValue({ on: false });
    now.mockReturnValue(Date.parse('2026-11-18T22:01:02Z'));
    expect((await proxyScooterSnapshot(request(), hard, store)).headers.has('X-Scooter-Origin')).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  describe("a neighbour's view", () => {
    // A desktop's view of Zürich at zoom 15, and a phone's inside it.
    const wide = 'south=47.36&west=8.51&north=47.39&east=8.57&zoom=15';
    const inside = 'south=47.37&west=8.53&north=47.38&east=8.55&zoom=15';
    const scooter = (provider: string, lat: number, lng: number) => ({ provider, lat, lng, battery: 80, range_m: null,
      vehicle_id: null, deep_link: null, distance_m: null });
    const parking = (name: string, lat: number, lng: number) => ({ id: name, provider: 'voi', name, lat, lng, mandatory: false });
    // The desktop's answer, as the cache gives it: a Voi and a Tier in the phone's view and a Lime south-west of it,
    // Bolt's faded north-east of it and a Voi's in it, a parking in it (Central) and one south of it (Bellevue).
    const desktop = (meta: Record<string, unknown>) => Response.json({
      vehicles: [scooter('voi', 47.3755, 8.5412), scooter('lime', 47.3643, 8.5183), scooter('tier', 47.3721, 8.5447)],
      clusters: [], providers: { voi: 1, lime: 1, tier: 1 },
      lastSeen: { vehicles: [scooter('bolt', 47.3852, 8.5611), scooter('voi', 47.3768, 8.5352)], clusters: [],
        providers: { bolt: { seenAt: '2026-11-18T21:40:00.000Z', updating: false }, voi: { seenAt: '2026-11-18T21:50:00.000Z', updating: true } } },
      parking: [parking('Bellevue', 47.3668, 8.5449), parking('Central', 47.3773, 8.5436)],
      meta: { totalVehicles: 3, lastSeenAt: '2026-11-18T21:40:00.000Z', availableProviders: ['somewhere-else'], ...meta },
    }, { headers: { 'Cache-Control': 'private, no-store', 'X-Scooter-Public-Cache-Control': 'public, max-age=30' } });
    const keep = async (search: string, meta: Record<string, unknown> = { truncated: false, generatedAt: '2026-11-18T22:00:00Z' }) => {
      const kept = memory();
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(desktop(meta));
      await proxyScooterSnapshot(scooters(search), env, kept.store);
      await kept.settled();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('error code: 1033', { status: 530 }));
      return kept;
    };

    it('is given the answer of a view that holds it whole while the server is down, cut down to its box', async () => {
      const { store } = await keep(wide);
      const response = await proxyScooterSnapshot(scooters(inside), env, store);
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Scooter-Origin')).toBe('down');
      // Not the Lime outside it, nor Bolt's faded one or Bellevue, and counted without them, as the cache would have
      // answered the phone (week review of 24 November 2026, W4).
      expect(await response.json()).toEqual({
        vehicles: [scooter('voi', 47.3755, 8.5412), scooter('tier', 47.3721, 8.5447)],
        clusters: [], providers: { voi: 1, tier: 1 },
        lastSeen: { vehicles: [scooter('voi', 47.3768, 8.5352)], clusters: [],
          providers: { voi: { seenAt: '2026-11-18T21:50:00.000Z', updating: true } } },
        parking: [parking('Central', 47.3773, 8.5436)],
        meta: { truncated: false, generatedAt: '2026-11-18T22:00:00Z', stale: true, totalVehicles: 2,
          lastSeenAt: '2026-11-18T21:50:00.000Z', availableProviders: providersForViewport({ south: 47.37, west: 8.53, north: 47.38, east: 8.55 }) },
      });
      // Its centre a tile or so away, holding none of the scooters, faded or not: no lastSeen nor its time.
      const near = await proxyScooterSnapshot(scooters('south=47.365&west=8.52&north=47.375&east=8.54&zoom=15'), env, store);
      expect(near.status).toBe(200);
      const body = await near.json() as { meta: Record<string, unknown> };
      expect(body).toMatchObject({ vehicles: [], providers: {}, parking: [], meta: { totalVehicles: 0 } });
      expect(body).not.toHaveProperty('lastSeen');
      expect(body.meta).not.toHaveProperty('lastSeenAt');
    });

    it('gives its own view the answer kept for it whole', async () => {
      const { store } = await keep(wide);
      const own = await proxyScooterSnapshot(scooters(wide), env, store);
      expect(own.status).toBe(200);
      expect(await own.json()).toMatchObject({ providers: { voi: 1, lime: 1, tier: 1 },
        lastSeen: { vehicles: [scooter('bolt', 47.3852, 8.5611), scooter('voi', 47.3768, 8.5352)] },
        parking: [parking('Bellevue', 47.3668, 8.5449), parking('Central', 47.3773, 8.5436)],
        meta: { totalVehicles: 3, lastSeenAt: '2026-11-18T21:40:00.000Z', availableProviders: ['somewhere-else'], stale: true } });
    });

    it('is not given one with groups, nor one not of the cache\'s shape', async () => {
      for (const body of [{ vehicles: [], clusters: [{ id: 'c', lat: 47.375, lng: 8.54, count: 2, providers: { voi: 2 } }] },
        { vehicles: [], clusters: [], lastSeen: { vehicles: [], clusters: [{ id: 'seen:c', lat: 47.375, lng: 8.54, count: 2, providers: { voi: 2 } }] } },
        { vehicles: 'none' }]) {
        const kept = memory();
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({ ...body, meta: { truncated: false, mode: 'vehicles' } },
          { headers: { 'X-Scooter-Public-Cache-Control': 'public, max-age=30' } }));
        await proxyScooterSnapshot(scooters(wide), env, kept.store);
        await kept.settled();
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('error code: 1033', { status: 530 }));
        expect((await proxyScooterSnapshot(scooters(inside), env, kept.store)).status).toBe(503);
        expect((await proxyScooterSnapshot(scooters(wide), env, kept.store)).status).toBe(200);
      }
    });

    it('is not given one that misses part of it, of another zoom or filter, or cut short', async () => {
      const { store } = await keep(wide);
      for (const search of [
        'south=47.37&west=8.56&north=47.38&east=8.58&zoom=15',
        'south=47.37&west=8.53&north=47.38&east=8.55&zoom=16',
        'south=47.37&west=8.53&north=47.38&east=8.55&zoom=15&minRange=5000',
      ]) expect((await proxyScooterSnapshot(scooters(search), env, store)).status).toBe(503);
      for (const meta of [{ truncated: true }, {}]) {
        const cut = await keep(wide, meta);
        expect((await proxyScooterSnapshot(scooters(inside), env, cut.store)).status).toBe(503);
      }
    });

    it('serves a clustered fallback only for its exact view', async () => {
      const { store } = await keep(wide, { mode: 'clusters', truncated: false });
      expect((await proxyScooterSnapshot(scooters(wide), env, store)).status).toBe(200);
      expect((await proxyScooterSnapshot(scooters(inside), env, store)).status).toBe(503);
    });

    it('is not given one the cache would have answered at a lower zoom', async () => {
      // As wide as two 4K screens across at zoom 15: answered at 14.
      const { store } = await keep('south=47.2&west=8.2&north=47.6&east=8.9&zoom=15');
      expect((await proxyScooterSnapshot(scooters(inside), env, store)).status).toBe(503);
    });

    it('is given nothing older than the map shows, nor kept past a licence’s limit', async () => {
      const now = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-18T22:00:00Z'));
      const { store } = await keep(wide);
      now.mockReturnValue(Date.parse('2026-11-18T22:15:01Z'));
      expect((await proxyScooterSnapshot(scooters(inside), env, store)).status).toBe(503);

      now.mockReturnValue(Date.parse('2026-11-18T22:00:00Z'));
      const capped = memory();
      const limited = answer({ truncated: false });
      limited.headers.set('X-Scooter-Keep-Seconds', '60');
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(limited);
      await proxyScooterSnapshot(scooters(wide), env, capped.store);
      await capped.settled();
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 530 }));
      now.mockReturnValue(Date.parse('2026-11-18T22:01:00Z'));
      expect((await proxyScooterSnapshot(scooters(inside), env, capped.store)).status).toBe(200);
      now.mockReturnValue(Date.parse('2026-11-18T22:01:01Z'));
      expect((await proxyScooterSnapshot(scooters(inside), env, capped.store)).status).toBe(503);
    });

    it('keeps no area for the zones, nor for a view across the 180° line', async () => {
      const { entries } = await keep('south=-47.06&west=159.9&north=-25.98&east=-157.1&zoom=6');
      expect([...entries.keys()]).toEqual(['https://map.example/api/scooters?east=-157.1&north=-25.98&south=-47.06&west=159.9&zoom=6']);
      const zones = memory();
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(Response.json({ zones: [] }, { headers: { 'X-Scooter-Public-Cache-Control': 'public, max-age=300' } }));
      await proxyScooterSnapshot(new Request(`https://map.example/api/zones?${wide}`), env, zones.store);
      await zones.settled();
      expect(zones.entries.size).toBe(1);
    });
  });
});

it('refuses a client that is none of our maps and apps wherever passes are signed, unless it is one of our scripts', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ vehicles: [] }));
  const token = 'audit-token-of-thirty-two-chars-or-more';
  const passes = { ...env, MAP_PASS_SECRET: 'pass-secret', SCOOTER_AUDIT_TOKEN: token };
  const pass = await issueMapPass('pass-secret', '192.0.2.1');
  const forged = `${pass.slice(0, -1)}${pass.endsWith('A') ? 'B' : 'A'}`;
  const ask = (headers: Record<string, string>, environment: typeof env = passes, url = request().url) =>
    proxyScooterSnapshot(new Request(url, { headers: { 'cf-connecting-ip': '192.0.2.1', 'User-Agent': SAFARI, ...headers } }), environment);
  // A script under a browser's user agent, as the one that polled Mainz and Wiesbaden on 19 and 20 November 2026, a
  // forged pass, or no user agent at all: 403, and the cache is not asked.
  const scripts: Record<string, string>[] = [{ 'User-Agent': 'Mozilla/5.0' }, { Cookie: `${MAP_PASS_COOKIE}=${forged}` }, {},
    { 'X-Scooter-Audit': 'audit-token-of-thirty-two-chars-or-mor' }];
  for (const headers of scripts) {
    const refused = await ask(headers);
    expect(refused.status).toBe(403);
    expect(await refused.json()).toEqual({ error: 'The scooter data is only for the ScootRadar map and apps.' });
  }
  // Nor, naming a view or showing a pass, under a user agent neither a browser's nor our apps', scooters or zones.
  const view = { 'X-Scooter-View': '12345678-1234-1234-1234-123456789abc.2' };
  const zonesUrl = 'https://map.example/api/zones?south=47.36&west=8.53&north=47.38&east=8.55&zoom=15';
  for (const userAgent of ['Mozilla/5.0', 'python-requests/2.32.3', 'curl/8.7.1', 'PiHomeSystem/1.0 (read-only nearby scooter map)', '',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.4; +https://openai.com/gptbot']) {
    expect((await ask({ ...view, 'User-Agent': userAgent })).status).toBe(403);
    expect((await ask({ ...view, 'User-Agent': userAgent, Cookie: `${MAP_PASS_COOKIE}=${pass}` })).status).toBe(403);
    expect((await ask({ 'User-Agent': userAgent }, passes, zonesUrl)).status).toBe(403);
  }
  expect(fetcher).not.toHaveBeenCalled();
  // Our scripts with the token, whatever their user agent, our maps and apps, as before; the zones are not refused.
  expect((await ask({ 'X-Scooter-Audit': token })).status).toBe(200);
  expect((await ask({ 'X-Scooter-Audit': token, 'User-Agent': 'node' })).status).toBe(200);
  expect(new Headers(fetcher.mock.lastCall?.[1]?.headers).get('X-Scooter-Client')).toBe('verified');
  // Firefox, Chrome on Android and an in-app web view are browsers.
  for (const userAgent of ['Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
    'Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 400.0']) {
    expect((await ask({ ...view, 'User-Agent': userAgent })).status).toBe(200);
  }
  expect((await ask({ 'X-Scooter-View': '12345678-1234-1234-1234-123456789abc.2' })).status).toBe(200);
  expect((await ask({ 'User-Agent': 'okhttp/5.5.1' })).status).toBe(200);
  expect((await ask({ Cookie: `${MAP_PASS_COOKIE}=${pass}` })).status).toBe(200);
  expect((await ask({}, passes, 'https://map.example/api/zones?south=47.36&west=8.53&north=47.38&east=8.55&zoom=15')).status).toBe(200);
  // A token too short to be one is no token; without the key that signs passes, nobody is refused.
  const short = { ...passes, SCOOTER_AUDIT_TOKEN: 'short' };
  expect((await ask({ 'X-Scooter-Audit': 'short' }, short)).status).toBe(403);
  expect((await ask({ 'User-Agent': 'Mozilla/5.0' }, { ...passes, MAP_PASS_SECRET: undefined } as typeof env)).status).toBe(200);
  expect(new Headers(fetcher.mock.lastCall?.[1]?.headers).get('X-Scooter-Client')).toBe('other');
});

it('tells the cache a browser without a pass can be given one by Turnstile, only on the site\'s own host', async () => {
  const fetcher = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => Response.json({ vehicles: [] }));
  const passes = { ...env, MAP_PASS_SECRET: 'pass-secret', TURNSTILE_SECRET_KEY: 'turnstile-secret' };
  const pass = await issueMapPass('pass-secret', '192.0.2.1');
  const site = 'https://scootradar.com/api/scooters?south=45.72&west=4.79&north=45.8&east=4.9&zoom=13';
  const view = { 'X-Scooter-View': '12345678-1234-1234-1234-123456789abc.2' };
  const check = async (headers: Record<string, string>, environment: typeof env = passes, url = site) => {
    await proxyScooterSnapshot(new Request(url, { headers: { 'cf-connecting-ip': '192.0.2.1', 'User-Agent': SAFARI, ...headers } }), environment);
    return new Headers(fetcher.mock.lastCall?.[1]?.headers).get('X-Scooter-Pass-Check');
  };
  expect(await check(view)).toBe('turnstile');
  // Not with a pass, not for an app, not on another host or a preview, not without Turnstile's secret.
  expect(await check({ ...view, Cookie: `${MAP_PASS_COOKIE}=${pass}` })).toBeNull();
  expect(await check({ ...view, 'User-Agent': 'okhttp/5.5.1' })).toBeNull();
  expect(await check(view, passes, request().url)).toBeNull();
  expect(await check(view, { ...passes, TURNSTILE_SECRET_KEY: undefined } as typeof env)).toBeNull();
  // Nor for the zones.
  expect(await check(view, passes, 'https://scootradar.com/api/zones?south=47.36&west=8.53&north=47.38&east=8.55&zoom=15')).toBeNull();
});

it('passes the cache\'s request for a pass on to the map, which then asks Turnstile', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'check' }, { status: 428 }));
  const response = await proxyScooterSnapshot(new Request('https://scootradar.com/api/scooters?south=45.72&west=4.79&north=45.8&east=4.9&zoom=13',
    { headers: { 'cf-connecting-ip': '192.0.2.1', 'User-Agent': SAFARI, 'X-Scooter-View': '12345678-1234-1234-1234-123456789abc.2' } }),
  { ...env, MAP_PASS_SECRET: 'pass-secret', TURNSTILE_SECRET_KEY: 'turnstile-secret' });
  expect(response.status).toBe(428);
  expect(response.headers.get('X-Scooter-Pass')).toBe('none');
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
});
