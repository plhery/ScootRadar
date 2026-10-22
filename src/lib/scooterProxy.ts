import { parseScooterQuery } from '@/lib/scooterQuery';
import { API_CONTENT_SECURITY_POLICY } from '@/lib/contentSecurityPolicy';
import { VEHICLE_MAX_AGE_MS } from '@/lib/dataFreshness';
import { skippedSources } from '@/lib/scooterSources';

interface SnapshotProxyEnvironment {
  SCOOTER_SNAPSHOT_API_URL: string;
  SCOOTER_SNAPSHOT_API_TOKEN?: string;
  SCOOTER_API_RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

/** A cache of the data centre (`caches.open` in worker.ts) and the invocation's waitUntil. */
export interface LastGoodStore {
  cache: { match(key: string): Promise<Response | undefined>; put(key: string, response: Response): Promise<void> };
  waitUntil(promise: Promise<unknown>): void;
}

// The last good answer to each request is kept in the cache of the data centre and,
// when the origin fails, given again marked stale, so the map rides out a blip of
// Netcup or the scooter cache: scooters for as long as the map shows positions,
// zones, which rarely change, for a day.
const LAST_GOOD_SECONDS = { scooters: VEHICLE_MAX_AGE_MS / 1000, zones: 86_400 };
const STORED_AT = 'X-Scooter-Stored-At';

async function lastGoodAnswer(store: LastGoodStore, kept: { key: string; seconds: number }, headers: Record<string, string>) {
  try {
    const stored = await store.cache.match(kept.key);
    const age = stored ? Math.max(0, Math.floor((Date.now() - Number(stored.headers.get(STORED_AT))) / 1000)) : Number.NaN;
    if (!stored || !(age <= kept.seconds)) return null;
    const body = await stored.json() as { meta?: Record<string, unknown> };
    // The apps already show a stale answer as delayed (dockModel.ts, ScooterMapModel.swift).
    if (body.meta) body.meta.stale = true;
    return { age, response: Response.json(body, { headers: { ...headers,
      'X-Mobility-Data-Status': 'stale', 'X-Scooter-Last-Good-Age': String(age) } }) };
  } catch {
    return null;
  }
}

// Runs before Next.js: map requests do one small origin read and never fan out
// to operator APIs inside a Cloudflare invocation.
export async function proxyScooterSnapshot(request: Request, env: SnapshotProxyEnvironment, lastGood?: LastGoodStore): Promise<Response> {
  const securityHeaders = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': API_CONTENT_SECURITY_POLICY, 'X-Frame-Options': 'DENY',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' };
  const headers = { ...securityHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' };
  if (request.method !== 'GET') return new Response('{}', { status: 405, headers });
  let kept: { key: string; seconds: number } | null = null;
  const unavailable = async (failure: { status: number } | { error: string }) => {
    const stale = kept && lastGood ? await lastGoodAnswer(lastGood, kept, headers) : null;
    console.error(JSON.stringify({ event: 'scooter_origin_failure', ...failure, ...(stale && { lastGoodAge: stale.age }) }));
    return stale?.response ?? Response.json({ error: 'Scooter data is temporarily unavailable. Please try again shortly.' },
      { status: 503, headers: { ...headers, 'Retry-After': '30' } });
  };
  try {
    const allowed = await env.SCOOTER_API_RATE_LIMITER.limit({ key: request.headers.get('cf-connecting-ip') ?? 'unknown' });
    if (!allowed.success) return Response.json({ error: 'Too many scooter requests. Please try again shortly.' },
      { status: 429, headers: { ...headers, 'Retry-After': '60' } });
    const url = new URL(request.url);
    const parsed = parseScooterQuery(url.searchParams);
    if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400, headers });
    // The zones of the map's layer come the same way, from the same origin (src/lib/zones.ts).
    const zones = url.pathname === '/api/zones';
    if (parsed.query.outsideCoverage) return Response.json(zones ? {
      zones: [], meta: { generatedAt: new Date().toISOString(), pending: false, truncated: false },
    } : {
      vehicles: [], clusters: [], providers: {},
      meta: { partial: false, stale: false, failedSources: [],
        sources: skippedSources(),
        generatedAt: new Date().toISOString(), truncated: false, totalVehicles: 0,
        mode: parsed.zoom !== null && parsed.zoom <= 15 ? 'clusters' : 'vehicles',
        zoom: parsed.zoom, availableProviders: [] },
    }, { headers: { ...headers, 'Cache-Control': 'public, max-age=300' } });
    // The apps ask in different orders.
    const search = new URLSearchParams(url.search);
    search.sort();
    kept = { key: `${url.origin}${url.pathname}?${search}`, seconds: LAST_GOOD_SECONDS[zones ? 'zones' : 'scooters'] };
    if (!env.SCOOTER_SNAPSHOT_API_TOKEN) throw new Error('Missing origin credential');
    const upstream = new URL(zones ? '/api/zones' : '/api/scooters', env.SCOOTER_SNAPSHOT_API_URL);
    upstream.search = url.search;
    const response = await fetch(upstream, { headers: { Accept: 'application/json', Authorization: `Bearer ${env.SCOOTER_SNAPSHOT_API_TOKEN}`,
      'X-Scooter-Client-IP': request.headers.get('cf-connecting-ip') ?? 'unknown' }, redirect: 'manual', signal: AbortSignal.timeout(5000) });
    // Workers support manual redirects; never forward the service credential to a redirect target.
    if ((response.status >= 300 && response.status < 400) || response.status >= 500 || response.status === 401 || response.status === 403) {
      return await unavailable({ status: response.status });
    }
    const publicPolicy = response.headers.get('X-Scooter-Public-Cache-Control');
    const result = new Response(response.body, response);
    result.headers.set('Cache-Control', publicPolicy ?? 'private, no-store');
    result.headers.delete('X-Scooter-Public-Cache-Control');
    for (const [key, value] of Object.entries(securityHeaders)) result.headers.set(key, value);
    // Not an answer the cache is still collecting feeds or zones for: the one after it is kept.
    if (lastGood && response.status === 200 && publicPolicy?.startsWith('public')) {
      lastGood.waitUntil(lastGood.cache.put(kept.key, new Response(result.clone().body, { headers: { 'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${kept.seconds}`, [STORED_AT]: String(Date.now()) } })).catch(() => {}));
    }
    return result;
  } catch (error) {
    // The name only: a message may hold the request URL and its coordinates.
    return await unavailable({ error: error instanceof Error ? error.name : 'UnknownError' });
  }
}
