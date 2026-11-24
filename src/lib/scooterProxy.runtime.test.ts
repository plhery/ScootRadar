import { build } from 'esbuild';
import { convertV4MiniflareOptions, Miniflare, Response as RuntimeResponse } from 'miniflare';
import { expect, it } from 'vitest';

it('proxies authenticated requests and rejects redirects in the Workers runtime', async () => {
  const bundle = await build({
    stdin: {
      contents: `import { proxyScooterSnapshot } from './src/lib/scooterProxy';
        export default { fetch(request) { return proxyScooterSnapshot(request, {
          SCOOTER_SNAPSHOT_API_URL: 'https://origin.example',
          SCOOTER_SNAPSHOT_API_TOKEN: 'runtime-test-token',
          SCOOTER_API_RATE_LIMITER: { limit: async () => ({ success: true }) },
        }); } };`,
      resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, write: false, format: 'esm', platform: 'browser',
  });
  const authorizations: Array<string | null> = [];
  let redirect = false;
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true, compatibilityDate: '2026-07-13', compatibilityFlags: ['nodejs_compat'], script: bundle.outputFiles[0].text,
    outboundService(request) {
      expect(new URL(request.url).hostname).toBe('origin.example');
      authorizations.push(request.headers.get('Authorization'));
      return redirect
        ? new RuntimeResponse(null, { status: 302, headers: { Location: 'https://unexpected.example' } })
        : new RuntimeResponse('{"vehicles":[]}', { headers: {
          'Content-Type': 'application/json', 'Cache-Control': 'private, no-store',
          'X-Scooter-Public-Cache-Control': 'public, max-age=30',
        } });
    },
  }));
  try {
    const url = 'https://map.example/api/scooters?south=47.36&west=8.52&north=47.39&east=8.57&zoom=16';
    const response = await runtime.dispatchFetch(url);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ vehicles: [] });
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=30');
    redirect = true;
    const rejected = await runtime.dispatchFetch(url);
    expect(rejected.status).toBe(503);
    expect(rejected.headers.has('Location')).toBe(false);
    expect(authorizations).toEqual(['Bearer runtime-test-token', 'Bearer runtime-test-token']);
  } finally {
    await runtime.dispose();
  }
}, 30_000);

it('keeps the last good answer in the runtime\'s cache and gives it stale while the origin is down', async () => {
  const bundle = await build({
    stdin: {
      contents: `import { proxyScooterSnapshot } from './src/lib/scooterProxy';
        export default { async fetch(request, env, ctx) { return proxyScooterSnapshot(request, {
          SCOOTER_SNAPSHOT_API_URL: 'https://origin.example',
          SCOOTER_SNAPSHOT_API_TOKEN: 'runtime-test-token',
          SCOOTER_API_RATE_LIMITER: { limit: async () => ({ success: true }) },
        }, { cache: await caches.open('scooter-last-good'), waitUntil: promise => ctx.waitUntil(promise) }); } };`,
      resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, write: false, format: 'esm', platform: 'browser',
  });
  let down = false;
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true, compatibilityDate: '2026-07-13', compatibilityFlags: ['nodejs_compat'], script: bundle.outputFiles[0].text,
    outboundService() {
      return down
        ? new RuntimeResponse('{"error":"Scooter data is temporarily unavailable."}', { status: 503 })
        : new RuntimeResponse('{"vehicles":[],"meta":{"stale":false}}', { headers: {
          'Content-Type': 'application/json', 'Cache-Control': 'private, no-store',
          'X-Scooter-Public-Cache-Control': 'public, max-age=30',
        } });
    },
  }));
  try {
    const url = 'https://map.example/api/scooters?south=47.36&west=8.52&north=47.39&east=8.57&zoom=16';
    expect(await (await runtime.dispatchFetch(url)).json()).toEqual({ vehicles: [], meta: { stale: false } });
    down = true;
    // The answer is put in the cache after it is sent.
    let response = await runtime.dispatchFetch(url);
    for (let attempt = 0; response.status !== 200 && attempt < 20; attempt++) {
      await response.arrayBuffer();
      await new Promise(resolve => setTimeout(resolve, 50));
      response = await runtime.dispatchFetch(url);
    }
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ vehicles: [], meta: { stale: true } });
    expect(response.headers.get('X-Mobility-Data-Status')).toBe('stale');
    const other = await runtime.dispatchFetch(url.replace('zoom=16', 'zoom=17'));
    expect(other.status).toBe(503);
    await other.arrayBuffer();
  } finally {
    await runtime.dispose();
  }
}, 30_000);

it("gives a neighbour's view the kept answer of one that holds it, cut to its box, while the tunnel is gone, in the runtime's cache", async () => {
  const bundle = await build({
    stdin: {
      contents: `import { proxyScooterSnapshot } from './src/lib/scooterProxy';
        export default { async fetch(request, env, ctx) { return proxyScooterSnapshot(request, {
          SCOOTER_SNAPSHOT_API_URL: 'https://origin.example',
          SCOOTER_SNAPSHOT_API_TOKEN: 'runtime-test-token',
          SCOOTER_API_RATE_LIMITER: { limit: async () => ({ success: true }) },
        }, { cache: await caches.open('scooter-last-good'), waitUntil: promise => ctx.waitUntil(promise) }); } };`,
      resolveDir: process.cwd(), loader: 'ts',
    },
    bundle: true, write: false, format: 'esm', platform: 'browser',
  });
  let down = false;
  const runtime = new Miniflare(convertV4MiniflareOptions({
    modules: true, compatibilityDate: '2026-07-13', compatibilityFlags: ['nodejs_compat'], script: bundle.outputFiles[0].text,
    outboundService() {
      return down
        ? new RuntimeResponse('error code: 1033', { status: 530 })
        // b stands in the wider view only: the neighbour's answer is cut to its box (week review of 24 November 2026, W4).
        : new RuntimeResponse(JSON.stringify({
          vehicles: [{ id: 'a', provider: 'lime', lat: 47.375, lng: 8.54 }, { id: 'b', provider: 'lime', lat: 47.385, lng: 8.565 }],
          providers: { lime: 2 }, meta: { stale: false, truncated: false, totalVehicles: 2 },
        }), { headers: {
          'Content-Type': 'application/json', 'Cache-Control': 'private, no-store',
          'X-Scooter-Public-Cache-Control': 'public, max-age=30',
        } });
    },
  }));
  try {
    await (await runtime.dispatchFetch('https://map.example/api/scooters?south=47.36&west=8.51&north=47.39&east=8.57&zoom=15')).arrayBuffer();
    down = true;
    const inside = 'https://map.example/api/scooters?south=47.37&west=8.53&north=47.38&east=8.55&zoom=15';
    let response = await runtime.dispatchFetch(inside);
    for (let attempt = 0; response.status !== 200 && attempt < 20; attempt++) {
      await response.arrayBuffer();
      await new Promise(resolve => setTimeout(resolve, 50));
      response = await runtime.dispatchFetch(inside);
    }
    expect(response.status).toBe(200);
    expect(response.headers.get('X-Scooter-Origin')).toBe('down');
    const body = await response.json() as { vehicles: unknown; providers: unknown; meta: unknown };
    expect(body.vehicles).toEqual([{ id: 'a', provider: 'lime', lat: 47.375, lng: 8.54 }]);
    expect(body.providers).toEqual({ lime: 1 });
    expect(body.meta).toMatchObject({ stale: true, truncated: false, totalVehicles: 1 });
    const outside = await runtime.dispatchFetch('https://map.example/api/scooters?south=47.37&west=8.56&north=47.38&east=8.58&zoom=15');
    expect(outside.status).toBe(503);
    expect(outside.headers.get('X-Scooter-Origin')).toBe('down');
    expect(await outside.json()).toMatchObject({ maintenance: { planned: false } });
  } finally {
    await runtime.dispose();
  }
}, 30_000);
