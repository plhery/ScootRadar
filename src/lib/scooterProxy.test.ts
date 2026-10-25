import { describe, expect, it, vi } from 'vitest';
import { proxyScooterSnapshot, type LastGoodStore } from './scooterProxy';

const env = { SCOOTER_SNAPSHOT_API_TOKEN: 'test-service-token', SCOOTER_SNAPSHOT_API_URL: 'https://cache.example',
  SCOOTER_API_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) } };
const request = () => new Request('https://map.example/api/scooters?south=45.72&west=4.79&north=45.8&east=4.9&zoom=13');

describe('edge snapshot proxy', () => {
  it('answers unsupported empty places even during an origin outage', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    const response = await proxyScooterSnapshot(new Request('https://map.example/api/scooters?south=43&west=1&north=43.1&east=1.1&zoom=15'), env);
    expect(response.status).toBe(200);
    const body = await response.json() as { meta: { totalVehicles: number } };
    expect(body.meta.totalVehicles).toBe(0);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('uses one cache request and preserves freshness headers', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ vehicles: [] }, { headers: { 'Cache-Control': 'private, no-store', 'X-Scooter-Public-Cache-Control': 'public, max-age=30' } }));
    const response = await proxyScooterSnapshot(request(), env);
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=30');
    expect(fetcher).toHaveBeenCalledOnce();
    expect(String(fetcher.mock.calls[0][0])).toContain('https://cache.example/api/scooters?');
  });

  it('returns a retryable 503 when the origin is unavailable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await proxyScooterSnapshot(request(), env);
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(logged.mock.calls.map(([line]) => JSON.parse(line))).toEqual([{ event: 'scooter_origin_failure', error: 'TimeoutError' }]);
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
    redirect: 'manual', headers: { Accept: 'application/json', Authorization: 'Bearer test-service-token', 'X-Scooter-Client-IP': '192.0.2.1' },
  }));
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
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(answer({ stale: false, generatedAt: '2026-10-22T00:00:00Z' }));
    expect((await proxyScooterSnapshot(request(), env, store)).status).toBe(200);
    await settled();
    expect([...entries.keys()]).toEqual(['https://map.example/api/scooters?east=4.9&north=45.8&south=45.72&west=4.79&zoom=13']);
    expect(entries.values().next().value?.headers.get('Cache-Control')).toBe('public, max-age=900');

    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetcher.mockResolvedValueOnce(Response.json({ error: 'Scooter data is temporarily unavailable.' }, { status: 503 }));
    // The same view, its parameters in another order.
    const stale = await proxyScooterSnapshot(new Request('https://map.example/api/scooters?zoom=13&south=45.72&west=4.79&north=45.8&east=4.9'), env, store);
    expect(stale.status).toBe(200);
    expect(await stale.json()).toEqual({ vehicles: [{ id: 'a' }], meta: { stale: true, generatedAt: '2026-10-22T00:00:00Z' } });
    expect(stale.headers.get('Cache-Control')).toBe('private, no-store');
    expect(stale.headers.get('X-Mobility-Data-Status')).toBe('stale');
    expect(stale.headers.get('X-Scooter-Last-Good-Age')).toBe('0');
    expect(logged.mock.calls.map(([line]) => JSON.parse(line))).toEqual([{ event: 'scooter_origin_failure', status: 503, lastGoodAge: 0 }]);
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
    expect(await stale.json()).toEqual({ zones: [{ id: 'z' }], meta: { pending: false, stale: true } });
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
