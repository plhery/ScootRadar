import { describe, expect, it, vi } from 'vitest';
import { UpstreamJsonCache, upstreamCacheEntriesFor, type UpstreamJsonOptions } from '@/lib/upstreamJsonCache';

const options: UpstreamJsonOptions = {
  headers: { Accept: 'application/json' },
  freshSeconds: 30,
  staleIfErrorSeconds: 300,
  timeoutMs: 1_000,
};
const sensitiveUrl = 'https://example.com/feed?Geometry=8.5417%2C47.3769&q=Zurich+HB';

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('UpstreamJsonCache', () => {
  it('coalesces concurrent fetches and serves the fresh value from memory', async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetcher = vi.fn(() => new Promise<Response>(resolve => {
      resolveResponse = resolve;
    }));
    const cache = new UpstreamJsonCache({ fetcher });

    const first = cache.fetch<{ version: number }>('https://example.com/feed', options);
    const second = cache.fetch<{ version: number }>('https://example.com/feed', options);
    expect(fetcher).toHaveBeenCalledTimes(1);

    resolveResponse?.(jsonResponse({ version: 1 }));
    await expect(Promise.all([first, second])).resolves.toEqual([
      { data: { version: 1 }, stale: false, fetchedAt: expect.any(Number) },
      { data: { version: 1 }, stale: false, fetchedAt: expect.any(Number) },
    ]);

    await expect(cache.fetch('https://example.com/feed', options)).resolves.toEqual({
      data: { version: 1 },
      stale: false, fetchedAt: expect.any(Number),
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('drops the least recently used document when full, keeping metadata read every pass', async () => {
    const fetcher = vi.fn(async (url: RequestInfo | URL) => jsonResponse({ url: String(url) }));
    const hourly = { ...options, freshSeconds: 3_600 };
    const cache = new UpstreamJsonCache({ fetcher, maxEntries: 3 });
    await cache.fetch('https://example.com/a/discovery', hourly);
    await cache.fetch('https://example.com/a/status', options);
    await cache.fetch('https://example.com/b/status', options);
    // The next pass reads a's discovery again before a fourth document arrives.
    await cache.fetch('https://example.com/a/discovery', hourly);
    await cache.fetch('https://example.com/c/status', options);
    expect(cache.size).toBe(3);
    expect(cache.evictions).toBe(1);

    fetcher.mockClear();
    await cache.fetch('https://example.com/a/discovery', hourly);
    expect(fetcher).not.toHaveBeenCalled();
    await cache.fetch('https://example.com/a/status', options);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('grows to the catalog it is given and never shrinks', () => {
    const cache = new UpstreamJsonCache({ maxEntries: 2048 });
    // 215 feeds today (186 regional and the Swiss national ones): 2,322 documents.
    expect(upstreamCacheEntriesFor(215)).toBe(2_322);
    cache.reserve(upstreamCacheEntriesFor(215));
    expect(cache.capacity).toBe(2_322);
    cache.reserve(100);
    expect(cache.capacity).toBe(2_322);
    cache.reserve(upstreamCacheEntriesFor(415));
    expect(cache.capacity).toBe(4_482);
  });

  it('paces cold requests per host without delaying other providers or cache hits', async () => {
    vi.useFakeTimers();
    try {
      const started: Array<{ host: string; time: number }> = [];
      const cache = new UpstreamJsonCache({ fetcher: async url => {
        started.push({ host: new URL(String(url)).hostname, time: Date.now() });
        return jsonResponse({ ok: true });
      } });
      cache.paceHost('dott.example', 150);
      const first = cache.fetch('https://dott.example/a', options);
      const second = cache.fetch('https://dott.example/b', options);
      const other = cache.fetch('https://other.example/a', options);
      await vi.advanceTimersByTimeAsync(0);
      expect(started.map(entry => entry.host)).toEqual(['dott.example', 'other.example']);
      await first;
      await cache.fetch('https://dott.example/a', options);
      expect(started).toHaveLength(2);
      await vi.advanceTimersByTimeAsync(150);
      await Promise.all([first, second, other]);
      expect(started[2].time - started[0].time).toBe(150);
    } finally { vi.useRealTimers(); }
  });

  it('serves stale data during an outage and backs off before retrying', async () => {
    let now = 0;
    let failing = false;
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetcher = vi.fn(async () => {
      if (failing) throw new Error('upstream unavailable');
      return jsonResponse({ version: 1 });
    });
    const cache = new UpstreamJsonCache({ fetcher, now: () => now });

    await expect(cache.fetch(sensitiveUrl, options)).resolves.toEqual({
      data: { version: 1 },
      stale: false, fetchedAt: expect.any(Number),
    });

    now = 31_000;
    failing = true;
    await expect(cache.fetch(sensitiveUrl, options)).resolves.toEqual({
      data: { version: 1 },
      stale: true, fetchedAt: 0,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(warning).toHaveBeenCalledOnce();
    const logged = String(warning.mock.calls[0][0]);
    expect(JSON.parse(logged)).toEqual({
      event: 'upstream_stale_fallback',
      host: 'example.com',
      path: '/feed',
      errorType: 'Error',
      stage: 'request',
    });
    expect(logged).not.toContain('Geometry');
    expect(logged).not.toContain('Zurich');

    now = 32_000;
    await expect(cache.fetch(sensitiveUrl, options)).resolves.toEqual({
      data: { version: 1 },
      stale: true, fetchedAt: 0,
    });
    expect(fetcher).toHaveBeenCalledTimes(2);

    now = 331_000;
    await expect(cache.fetch(sensitiveUrl, options)).rejects.toThrow(
      'upstream unavailable'
    );
  });

  it('logs the network error code of a body cut off, without its message', async () => {
    let now = 0;
    let cut = false;
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetcher = vi.fn(async () => {
      if (!cut) return jsonResponse({ version: 1 });
      // Node's error when the operator closes the connection halfway through the body.
      const body = new ReadableStream({ pull: () => { throw new TypeError('terminated', { cause: { code: 'UND_ERR_SOCKET' } }); } });
      return new Response(body, { status: 200 });
    });
    const cache = new UpstreamJsonCache({ fetcher, now: () => now });
    await cache.fetch('https://sharedmobility.ch/v2/gbfs/voiscooters.com/free_bike_status', options);

    now = 31_000;
    cut = true;
    await expect(cache.fetch('https://sharedmobility.ch/v2/gbfs/voiscooters.com/free_bike_status', options))
      .resolves.toMatchObject({ stale: true });
    expect(JSON.parse(String(warning.mock.calls[0][0]))).toEqual({
      event: 'upstream_stale_fallback',
      host: 'sharedmobility.ch',
      path: '/v2/gbfs/voiscooters.com/free_bike_status',
      errorType: 'TypeError',
      errorCode: 'UND_ERR_SOCKET',
      stage: 'body',
    });
    warning.mockRestore();
  });

  it('fetches a fresh document again once older than the caller allows, keeping its usual freshness', async () => {
    let now = 0;
    let version = 1;
    const fetcher = vi.fn(async () => jsonResponse({ version }));
    const cache = new UpstreamJsonCache({ fetcher, now: () => now });
    const hourly = { ...options, freshSeconds: 3_600 };
    await cache.fetch('https://example.com/plans', hourly);

    now = 119_000;
    version = 2;
    await expect(cache.fetch('https://example.com/plans', { ...hourly, maxAgeSeconds: 120 }))
      .resolves.toMatchObject({ data: { version: 1 }, stale: false });
    expect(fetcher).toHaveBeenCalledTimes(1);

    now = 120_000;
    await expect(cache.fetch('https://example.com/plans', { ...hourly, maxAgeSeconds: 120 }))
      .resolves.toEqual({ data: { version: 2 }, stale: false, fetchedAt: 120_000 });
    expect(fetcher).toHaveBeenCalledTimes(2);
    // The new copy is kept an hour from now for everyone else.
    now = 3_700_000;
    await expect(cache.fetch('https://example.com/plans', hourly)).resolves.toMatchObject({ data: { version: 2 } });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('paces a document fetched again for its age like any other request to its host', async () => {
    vi.useFakeTimers();
    try {
      const started: number[] = [];
      const cache = new UpstreamJsonCache({ fetcher: async () => {
        started.push(Date.now());
        return jsonResponse({ ok: true });
      } });
      cache.paceHost('rideatom.example', 500);
      const hourly = { ...options, freshSeconds: 3_600 };
      await cache.fetch('https://rideatom.example/plans', hourly);
      await vi.advanceTimersByTimeAsync(120_000);
      const status = cache.fetch('https://rideatom.example/status', options);
      const plans = cache.fetch('https://rideatom.example/plans', { ...hourly, maxAgeSeconds: 120 });
      await vi.advanceTimersByTimeAsync(0);
      expect(started).toHaveLength(2);
      await vi.advanceTimersByTimeAsync(500);
      await Promise.all([status, plans]);
      expect(started[2] - started[1]).toBe(500);
    } finally { vi.useRealTimers(); }
  });

  it('does not cache unsuccessful HTTP responses without a stale value', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ error: true }, 503));
    const cache = new UpstreamJsonCache({ fetcher });

    await expect(cache.fetch('https://example.com/feed', options)).rejects.toThrow('HTTP 503');
    await expect(cache.fetch('https://example.com/feed', options)).rejects.toThrow('HTTP 503');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

it('rejects invalid HTTP 200 data before it can replace a good cached document', async () => {
  let now = 0;
  const fetcher = vi.fn().mockResolvedValueOnce(jsonResponse({ version: 1 })).mockResolvedValue(jsonResponse({ invalid: true }));
  const cache = new UpstreamJsonCache({ fetcher, now: () => now });
  const validate = (value: unknown) => { if (!value || typeof value !== 'object' || !('version' in value)) throw Error('invalid feed'); };
  await cache.fetch('https://test.example/feed', { ...options, validate });
  now = 31_000;
  await expect(cache.fetch('https://test.example/feed', { ...options, validate })).resolves.toEqual({ data: { version: 1 }, stale: true, fetchedAt: 0 });
});
