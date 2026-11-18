import { clientNetwork } from '@/lib/clientNetwork';
import { holdsMapPass, MAP_PASS_HEADER, validMapPass } from '@/lib/mapPass';
import { SCOOTER_CLIENT_HEADER, scooterClient } from '@/lib/scooterClient';
import { scooterView } from '@/lib/scooterView';
import { API_CONTENT_SECURITY_POLICY } from '@/lib/contentSecurityPolicy';
import { VEHICLE_MAX_AGE_MS } from '@/lib/dataFreshness';
import { skippedSources } from '@/lib/scooterSources';
import { maintenanceStatus, readAnnouncement, type Announcement, type MaintenanceEnvironment } from '@/lib/maintenance';
import { parseScooterQuery, scooterAnswerZoom } from '@/lib/scooterQuery';
import type { MapBounds } from '@/lib/types';

interface SnapshotProxyEnvironment extends MaintenanceEnvironment {
  SCOOTER_SNAPSHOT_API_URL: string;
  SCOOTER_SNAPSHOT_API_TOKEN?: string;
  SCOOTER_API_RATE_LIMITER: { limit(options: { key: string }): Promise<{ success: boolean }> };
  /** The key of the web map's passes (mapPass.ts); without it, or without Turnstile's secret, none is asked for. */
  MAP_PASS_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
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
// The cache sets it on an answer holding data of a feed whose licence lets it be kept only so long
// (Bird's, Spin's, Bolt's): the seconds until the oldest such data passes its cap, 0 to keep it not
// at all. The answer is kept no longer, and the limit is stored with it. Without it, as from a cache
// that predates it, LAST_GOOD_SECONDS alone.
const KEEP_SECONDS = 'X-Scooter-Keep-Seconds';
// The box an answer kept for its area was asked for: "south,west,north,east".
const STORED_BOUNDS = 'X-Scooter-Bounds';

/**
 * Statuses that mean the server did not answer: Traefik's and Cloudflare's own (530: the tunnel is gone, as while
 * Netcup reboots). A 503 of the cache itself is the server's only while it warms up after a start (WARMING_UP);
 * its other one, every feed of the view failing, is the operators', not maintenance.
 */
const UNREACHABLE = new Set([502, 503, 504, 520, 521, 522, 523, 524, 525, 526, 527, 530]);
const WARMING_UP = 'Scooter data is warming up.';

/** Whether the origin's answer says the server is down rather than the data unavailable. */
async function serverDown(response: Response) {
  if (!UNREACHABLE.has(response.status)) return false;
  if (response.status !== 503) return true;
  const text = await response.text().catch(() => '');
  try {
    const body = JSON.parse(text) as { error?: unknown } | null;
    return body?.error === WARMING_UP || typeof body?.error !== 'string';
  } catch {
    // Traefik's "Service Unavailable", with no container behind it.
    return true;
  }
}

/** How long a client waits before it asks again while the server is down: 30 seconds, up to two minutes before an announced return. */
function retryAfter(found: Announcement | null, now = Date.now()) {
  const back = found?.backAround ? Math.round((Date.parse(found.backAround) - now) / 1000) : 0;
  return String(Math.min(Math.max(back, 30), 120));
}

/**
 * What tells the apps the server is down, on a stale answer and on a 503 alike, so that each words a calm notice:
 * `X-Scooter-Origin: down`, the time it should be back by when maintenance was announced with one, and when to ask again.
 */
function downHeaders(found: Announcement | null): Record<string, string> {
  return { 'X-Scooter-Origin': 'down', 'Retry-After': retryAfter(found),
    ...(found?.backAround ? { 'X-Scooter-Back-Around': found.backAround } : {}) };
}

/** The seconds a header allows, at most `seconds`: none for a value that is not a count of them. */
function keepSeconds(value: string | null, seconds: number) {
  if (value === null) return seconds;
  const allowed = Number(value);
  return Number.isInteger(allowed) && allowed >= 0 ? Math.min(seconds, allowed) : 0;
}

/**
 * A view's answer is also kept for its area, so that a reader of a view no one asked for exactly is given one that
 * holds it while the origin is down: under the zoom and the tile of the zoom (256 pixels) of the box's centre, with
 * the box it was asked for, the last one asked there. It is given only for a box it holds whole, at the same zoom
 * and other parameters, answered at the same zoom, and not cut short (meta.truncated): then every scooter the box
 * would have been given is in it. Its age and its licence's limit are kept as for its own request.
 */
interface AreaQuery {
  bounds: MapBounds;
  zoom: number;
  /** The other parameters, sorted. */
  rest: string;
}

function areaQuery(url: URL): AreaQuery | null {
  const params = url.searchParams;
  const [south, west, north, east] = ['south', 'west', 'north', 'east'].map(side => params.get(side) === null ? Number.NaN : Number(params.get(side)));
  const zoom = Number(params.get('zoom') ?? Number.NaN);
  // Not across the 180° line, where boxes are not compared.
  if (![south, west, north, east].every(Number.isFinite) || !Number.isInteger(zoom) || west > east) return null;
  const rest = new URLSearchParams([...params].filter(([name]) => !['south', 'west', 'north', 'east'].includes(name)));
  rest.sort();
  return { bounds: { south, west, north, east }, zoom, rest: rest.toString() };
}

/** The tile of the zoom a point is in. */
function tileOf(lat: number, lng: number, zoom: number) {
  const scale = 2 ** zoom;
  const clamped = Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI / 180;
  const y = (1 - Math.log(Math.tan(Math.PI / 4 + clamped / 2)) / Math.PI) / 2;
  return { x: Math.floor((lng + 180) / 360 * scale), y: Math.floor(y * scale) };
}

function areaKey(origin: string, query: AreaQuery, tile: { x: number; y: number }) {
  return `${origin}/__last-good-area/${query.zoom}/${tile.x}/${tile.y}?${query.rest}`;
}

/** The keys of the area of a box, its own tile first, then the eight around it. */
function areaKeys(origin: string, query: AreaQuery) {
  const { bounds } = query;
  const centre = tileOf((bounds.south + bounds.north) / 2, (bounds.west + bounds.east) / 2, query.zoom);
  const keys = [areaKey(origin, query, centre)];
  for (const dx of [-1, 0, 1]) for (const dy of [-1, 0, 1]) {
    if (dx || dy) keys.push(areaKey(origin, query, { x: centre.x + dx, y: centre.y + dy }));
  }
  return keys;
}

const holds = (outer: MapBounds, inner: MapBounds) =>
  outer.south <= inner.south && outer.north >= inner.north && outer.west <= inner.west && outer.east >= inner.east;

interface Kept {
  key: string;
  seconds: number;
  /** Of an answer of scooters, its area (areaQuery). */
  area: AreaQuery | null;
}

type Stored = { age: number; body: { meta?: Record<string, unknown> } };

/** The answer kept under the key, if still young enough to be given, with its age, read. */
async function storedAnswer(store: LastGoodStore, key: string, seconds: number, area?: AreaQuery): Promise<Stored | null> {
  const stored = await store.cache.match(key);
  if (!stored) return null;
  const age = Math.max(0, Math.floor((Date.now() - Number(stored.headers.get(STORED_AT))) / 1000));
  if (!(age <= keepSeconds(stored.headers.get(KEEP_SECONDS), seconds))) return null;
  if (area) {
    const [south, west, north, east] = (stored.headers.get(STORED_BOUNDS) ?? '').split(',').map(Number);
    const bounds = { south, west, north, east };
    if (![south, west, north, east].every(Number.isFinite) || !holds(bounds, area.bounds)) return null;
    if (scooterAnswerZoom(area.zoom, bounds) !== scooterAnswerZoom(area.zoom, area.bounds)) return null;
  }
  const body = await stored.json() as Stored['body'];
  if (area && (!body.meta || body.meta.truncated !== false || body.meta.mode === 'clusters')) return null;
  return { age, body };
}

async function lastGoodAnswer(store: LastGoodStore, kept: Kept, headers: Record<string, string>) {
  try {
    let found = await storedAnswer(store, kept.key, kept.seconds);
    let fromArea = false;
    if (!found && kept.area) {
      for (const key of areaKeys(new URL(kept.key).origin, kept.area)) {
        found = await storedAnswer(store, key, kept.seconds, kept.area);
        if (found) {
          fromArea = true;
          break;
        }
      }
    }
    if (!found) return null;
    const { age, body } = found;
    // The apps already show a stale answer as delayed (dockModel.ts, ScooterMapModel.swift): all of it,
    // not the apps it named late when it was kept.
    if (body.meta) {
      body.meta.stale = true;
      delete body.meta.staleProviders;
    }
    return { age, fromArea, response: Response.json(body, { headers: { ...headers,
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
  let kept: Kept | null = null;
  // `down`: the server did not answer (or was announced away, `hard`), which the answer says (downHeaders), with
  // what was announced. Any other failure, of the cache or of its credential, is said as before.
  const unavailable = async (failure: { status: number } | { error: string } | null, down: boolean) => {
    const found = down ? await readAnnouncement(env) : null;
    const origin = down ? downHeaders(found) : {};
    const stale = kept && lastGood ? await lastGoodAnswer(lastGood, kept, { ...headers, ...origin }) : null;
    if (failure) console.error(JSON.stringify({ event: 'scooter_origin_failure', ...failure, ...(down && { down: true }),
      ...(stale && { lastGoodAge: stale.age, ...(stale.fromArea && { lastGoodArea: true }) }) }));
    return stale?.response ?? Response.json({ error: 'Scooter data is temporarily unavailable. Please try again shortly.',
      ...(down && { maintenance: maintenanceStatus(found) }) },
    { status: 503, headers: { ...headers, 'Retry-After': '30', ...origin } });
  };
  try {
    // An IPv6 visitor by its /64, here and at the cache (clientNetwork).
    const client = clientNetwork(request.headers.get('cf-connecting-ip') ?? 'unknown');
    const allowed = await env.SCOOTER_API_RATE_LIMITER.limit({ key: client });
    if (!allowed.success) return Response.json({ error: 'Too many scooter requests. Please try again shortly.' },
      { status: 429, headers: { ...headers, 'Retry-After': '60' } });
    const url = new URL(request.url);
    const parsed = parseScooterQuery(url.searchParams);
    if (!parsed.ok) return Response.json({ error: parsed.error }, { status: 400, headers });
    // The zones of the map's layer come the same way, from the same origin (src/lib/zones.ts).
    const zones = url.pathname === '/api/zones';
    if (parsed.query.outsideCoverage) return Response.json(zones ? {
      zones: [], meta: { generatedAt: new Date().toISOString(), pending: false, unavailable: false, truncated: false },
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
    kept = { key: `${url.origin}${url.pathname}?${search}`, seconds: LAST_GOOD_SECONDS[zones ? 'zones' : 'scooters'],
      area: zones ? null : areaQuery(url) };
    if (!env.SCOOTER_SNAPSHOT_API_TOKEN) throw new Error('Missing origin credential');
    // Maintenance announced `hard`: the server is left alone from its start, and the readers given what is kept.
    if ((await readAnnouncement(env))?.mode === 'hard') return await unavailable(null, true);
    const upstream = new URL(zones ? '/api/zones' : '/api/scooters', env.SCOOTER_SNAPSHOT_API_URL);
    upstream.search = url.search;
    const view = scooterView(request.headers.get('X-Scooter-View'));
    // Who asks: a map with a pass (a browser's cookie, an app's header), a map of ours, an app too old to name its
    // view, or another client, which the cache answers from what it holds (scooterClient.ts).
    const pass = await holdsMapPass(request.headers.get('Cookie'), env.MAP_PASS_SECRET, client)
      || await validMapPass(request.headers.get(MAP_PASS_HEADER), env.MAP_PASS_SECRET, client);
    const asker = scooterClient({ pass, view: !!view, userAgent: request.headers.get('User-Agent') });
    let response: Response;
    try {
      response = await fetch(upstream, { headers: { Accept: 'application/json', Authorization: `Bearer ${env.SCOOTER_SNAPSHOT_API_TOKEN}`,
        ...(view && !zones ? { 'X-Scooter-View': `${view.id}.${view.sequence}` } : {}),
        'X-Scooter-Client-IP': client, [SCOOTER_CLIENT_HEADER]: asker }, redirect: 'manual', signal: AbortSignal.timeout(5000) });
    } catch (error) {
      // Unreached, or no answer in time: the server is down, as while Netcup reboots.
      // The name only: a message may hold the request URL and its coordinates.
      return await unavailable({ error: error instanceof Error ? error.name : 'UnknownError' }, true);
    }
    // Workers support manual redirects; never forward the service credential to a redirect target.
    if ((response.status >= 300 && response.status < 400) || response.status >= 500 || response.status === 401 || response.status === 403) {
      return await unavailable({ status: response.status }, await serverDown(response));
    }
    const publicPolicy = response.headers.get('X-Scooter-Public-Cache-Control');
    const seconds = keepSeconds(response.headers.get(KEEP_SECONDS), kept.seconds);
    const result = new Response(response.body, response);
    result.headers.set('Cache-Control', publicPolicy ?? 'private, no-store');
    result.headers.delete('X-Scooter-Public-Cache-Control');
    result.headers.delete(KEEP_SECONDS);
    for (const [key, value] of Object.entries(securityHeaders)) result.headers.set(key, value);
    // The maps ask for a pass when an answer says they have none (mapPassClient.ts, appPass.ts).
    if (!zones && !pass && env.MAP_PASS_SECRET && env.TURNSTILE_SECRET_KEY) result.headers.set(MAP_PASS_HEADER, 'none');
    // Not an answer the cache is still collecting feeds or zones for: the one after it is kept.
    if (lastGood && response.status === 200 && publicPolicy?.startsWith('public') && seconds > 0) {
      const keep = (key: string, extra: Record<string, string> = {}) => lastGood.waitUntil(lastGood.cache.put(key,
        new Response(result.clone().body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${seconds}`,
          [STORED_AT]: String(Date.now()), [KEEP_SECONDS]: String(seconds), ...extra } })).catch(() => {}));
      keep(kept.key);
      const { area } = kept;
      if (area) {
        const { south, west, north, east } = area.bounds;
        keep(areaKeys(url.origin, area)[0], { [STORED_BOUNDS]: `${south},${west},${north},${east}` });
      }
    }
    return result;
  } catch (error) {
    // The name only: a message may hold the request URL and its coordinates.
    return await unavailable({ error: error instanceof Error ? error.name : 'UnknownError' }, false);
  }
}
