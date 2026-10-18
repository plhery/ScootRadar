import { describe, expect, it, vi } from 'vitest';
import { proxyScooterSnapshot } from './scooterProxy';

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
