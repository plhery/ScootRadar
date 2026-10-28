import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHash, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { parseScooterQuery } from '../src/lib/scooterQuery';
import { answerKeepUntil, collectsSlowly, demandedFeeds, feedsForQuery, querySnapshot, showsPositions, VEHICLE_MAX_AGE_MS,
  type MobilitySnapshot } from '../src/lib/scooterSnapshots';
import { ScooterFeedsUnavailableError } from '../src/lib/scooterFeeds';
import { scooterResponseHeaders } from '../src/lib/scooterResponse';
import { collectsParking, isAppMapFeed } from '../src/lib/regionalScooterSystems';
import { zoneQueryError, type ZoneResponse } from '../src/lib/zones';
import type { FeedQuery } from '../src/lib/scooterFeeds';
import type { MapBounds } from '../src/lib/types';
import type { SnapshotMetrics } from './metrics';
import { reportError } from './errorReporting';
import { ALWAYS_FAST, feedState, parkingUp, type FeedCadence } from './feedStateLog';

/** Collects feeds on demand: the scheduler. */
export interface FeedRefresher {
  /**
   * Marks the feeds as watched, and collects at once those last collected over an active interval
   * ago; their sweeps start where `focus`, the area asked for, is. Returns the feeds it collects at once.
   */
  demand(ids: string[], now: number, focus?: MapBounds): string[];
  /** A collection a request asked for is queued or under way. */
  refreshing(id: string): boolean;
  /**
   * Resolves with true once the feeds' collections have finished, or the first of them with `first`,
   * or with false after timeoutMs.
   */
  wait(ids: string[], timeoutMs: number, first?: boolean): Promise<boolean>;
}

/**
 * How long a request waits at most for feeds quick to collect whose positions are too old to show.
 * The Worker gives the origin 5 seconds (src/lib/scooterProxy.ts).
 */
export const COLD_WAIT_MS = 3_000;
/**
 * Once the first of them is in, how long the answer waits for the others to join it, rather than
 * each coming in on a request of its own.
 */
export const JOIN_WAIT_MS = 300;

interface ServerOptions {
  snapshot: () => MobilitySnapshot | undefined;
  token?: string;
  production?: boolean;
  version?: string;
  metrics?: SnapshotMetrics;
  /** Opens /metrics to this bearer token; it answers 404 without one. */
  metricsToken?: string;
  /** How often each feed is meant to be collected, which /ready judges it by. */
  cadence?: FeedCadence;
  refresher?: FeedRefresher;
  /** COLD_WAIT_MS by default. */
  coldWaitMs?: number;
  /** JOIN_WAIT_MS by default. */
  joinWaitMs?: number;
  /** How old a slow feed's last positions may be to stand faded: LAST_SEEN_MAX_AGE_MS by default. */
  lastSeenMaxAgeMs?: (feedId: string) => number | undefined;
  /** Answers /api/zones, the zones of the feeds in the area; it answers 404 without. */
  zones?: (query: FeedQuery) => Promise<ZoneResponse>;
  /** How long a feed's data may be kept, for those with a cap (retentionCaps in cadence.ts). */
  retention?: (feedId: string) => number | undefined;
}

// The Worker's address searches report here how many requests they sent to Geoapify.
const GEOCODE_USAGE_PATH = '/api/geocode-usage';
const ZONES_PATH = '/api/zones';
const ROUTES = new Set(['/api/scooters', ZONES_PATH, GEOCODE_USAGE_PATH, '/health', '/ready', '/feeds', '/metrics']);

export function createSnapshotServer(options: ServerOptions) {
  if (options.production && (!options.token || options.token.length < 32)) {
    throw new Error('SCOOTER_SNAPSHOT_API_TOKEN must contain at least 32 characters in production');
  }
  if (options.production && options.metricsToken && options.metricsToken.length < 32) {
    throw new Error('METRICS_TOKEN must contain at least 32 characters in production');
  }
  const tokenHash = options.token ? createHash('sha256').update(`Bearer ${options.token}`).digest() : null;
  const metricsTokenHash = options.metricsToken ? createHash('sha256').update(`Bearer ${options.metricsToken}`).digest() : null;
  const clients = new Map<string, { count: number; resetAt: number }>();
  let activeResponses = 0;
  const cadence = options.cadence ?? ALWAYS_FAST;
  const fromWorker = (request: IncomingMessage) => tokenHash
    ? timingSafeEqual(tokenHash, createHash('sha256').update(request.headers.authorization ?? '').digest())
    : ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress ?? '');
  async function handle(request: IncomingMessage, response: ServerResponse) {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'private, no-store');
    let url: URL;
    try { url = new URL(request.url ?? '/', 'http://localhost'); }
    catch { response.writeHead(400); response.end('{"error":"Invalid request URL"}'); return; }
    const method = url.pathname === GEOCODE_USAGE_PATH ? 'POST' : 'GET';
    if (request.method !== method) { response.writeHead(405, { Allow: method }); response.end('{}'); return; }
    if (url.pathname === GEOCODE_USAGE_PATH) {
      if (!fromWorker(request)) { response.writeHead(401); response.end('{}'); return; }
      // A search sends Geoapify one to three requests.
      const requests = Number(url.searchParams.get('geoapify'));
      if (!Number.isInteger(requests) || requests < 1 || requests > 10) { response.writeHead(400); response.end('{}'); return; }
      options.metrics?.recordGeoapifyRequests(requests);
      response.writeHead(204); response.end(); return;
    }
    let snapshot = options.snapshot();
    const now = Date.now();
    if (url.pathname === '/health' || url.pathname === '/ready') {
      const feeds = (snapshot?.feeds ?? []).filter(feed => !feed.skipped);
      // Not attempted yet, as a feed a deploy adds: warming up, not failed.
      const attempted = feeds.filter(feed => feed.attemptedAt > 0);
      const live = !!snapshot && now - snapshot.updatedAt < VEHICLE_MAX_AGE_MS;
      // Usable: collected as often as its cadence promises, so served at once or on the next request.
      const usable = feeds.filter(feed => feedState(feed, now, cadence) !== 'expired');
      const ready = live && usable.length > 0;
      response.writeHead((url.pathname === '/health' ? live : ready) ? 200 : 503);
      response.end(JSON.stringify({ live, ready, updatedAt: snapshot?.updatedAt, feeds: snapshot?.feeds.length ?? 0,
        usableFeeds: usable.length,
        // Positions recent enough to show without collecting again.
        servedFeeds: feeds.filter(feed => showsPositions(feed, now)).length,
        failedFeeds: attempted.filter(feed => feedState(feed, now, cadence) !== 'ok').map(feed => feed.id),
        warmingFeeds: feeds.filter(feed => feed.attemptedAt === 0).map(feed => feed.id),
        oldestUsableAgeSeconds: usable.length ? Math.round(Math.max(...usable.map(feed => now - feed.observedAt)) / 1000) : null,
        parkingLocations: feeds.reduce((sum, feed) => sum + (feed.parking?.locations.length ?? 0), 0),
        // The app maps collect no parking, so only the feeds that do can miss it.
        failedParkingFeeds: attempted.filter(feed => collectsParking(feed) && !parkingUp(feed, now, cadence)).map(feed => feed.id),
        cities: snapshot?.overview.cities.length, version: options.version ?? 'local' }));
      return;
    }
    if (url.pathname === '/feeds') {
      // Each feed's state and scooters, which the weekly catalog check reads for the app maps
      // (--apps=cache): only the cache holds their sessions. No error text, which can name a key.
      response.writeHead(snapshot ? 200 : 503);
      response.end(JSON.stringify({ updatedAt: snapshot?.updatedAt, feeds: (snapshot?.feeds ?? []).map(feed => ({
        id: feed.id,
        state: feed.skipped ? 'skipped' : feed.attemptedAt === 0 ? 'warming' : feedState(feed, now, cadence),
        ...(feed.seasonOver && { seasonOver: true }),
        vehicles: feed.vehicles.length,
        observedAt: feed.observedAt || null,
      })) }));
      return;
    }
    if (url.pathname === '/metrics' && metricsTokenHash && options.metrics) {
      if (!timingSafeEqual(metricsTokenHash, createHash('sha256').update(request.headers.authorization ?? '').digest())) {
        response.writeHead(401, { 'WWW-Authenticate': 'Bearer' }); response.end('{}'); return;
      }
      response.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
      response.end(options.metrics.render(snapshot, now, url.searchParams.get('only') === 'counters'));
      return;
    }
    const zones = url.pathname === ZONES_PATH && options.zones;
    if (url.pathname !== '/api/scooters' && !zones) { response.writeHead(404); response.end('{}'); return; }
    if (!fromWorker(request)) { response.writeHead(401); response.end('{}'); return; }
    // Only an authenticated Worker may supply a client IP. It replaces any incoming header.
    const forwarded = request.headers['x-scooter-client-ip'];
    const key = tokenHash && typeof forwarded === 'string' && isIP(forwarded)
      ? forwarded : request.socket.remoteAddress ?? 'unknown';
    for (const [ip, entry] of clients) if (entry.resetAt <= now) clients.delete(ip);
    const client = clients.get(key) ?? { count: 0, resetAt: now + 60_000 };
    if (client.count >= 60 || activeResponses >= 32 || (!clients.has(key) && clients.size >= 10_000)) {
      response.writeHead(429, { 'Retry-After': '60' }); response.end('{}'); return;
    }
    client.count++; clients.set(key, client);
    activeResponses++;
    response.once('close', () => activeResponses--);
    const parsed = parseScooterQuery(url.searchParams);
    if (!parsed.ok) { response.writeHead(400); response.end(JSON.stringify({ error: parsed.error })); return; }
    if (zones) {
      const error = zoneQueryError(parsed.zoom, parsed.query.bounds);
      if (error) { response.writeHead(400); response.end(JSON.stringify({ error })); return; }
      const body = await zones(parsed.query);
      // Zones change rarely: a complete answer may be kept for five minutes.
      response.writeHead(200, { 'Cache-Control': 'private, no-store',
        'X-Scooter-Public-Cache-Control': body.meta.pending ? 'private, no-store' : 'public, max-age=300' });
      response.end(JSON.stringify(body));
      return;
    }
    if (!snapshot) { response.writeHead(503, { 'Retry-After': '5' }); response.end('{"error":"Scooter data is warming up."}'); return; }
    let refreshing: Set<string> | undefined;
    let idleInView: Set<string> | undefined;
    let comingSoon: Set<string> | undefined;
    const refresher = options.refresher;
    if (refresher) {
      // The feeds this answer uses are watched for a while, and collected again now if their data is over a minute old:
      // all but the Lime groups past the few nearest the middle of the view, which Lime's pace could not keep up.
      const inView = feedsForQuery(snapshot, parsed.query, parsed.zoom).filter(feed => !feed.skipped);
      const watched = demandedFeeds(inView, parsed.query.bounds);
      const demanded = new Set(watched.map(feed => feed.id));
      idleInView = new Set(inView.filter(feed => !demanded.has(feed.id)).map(feed => feed.id));
      const started = new Set(refresher.demand([...demanded], now, parsed.query.bounds));
      // Lime's rider-map accounts are shared by every visitor: how many of their refreshes each one sets off.
      options.metrics?.recordLimeWakes(key,
        watched.filter(feed => feed.provider === 'lime' && isAppMapFeed(feed) && started.has(feed.id)).length, now);
      // Positions too old to show would leave the map empty of a feed quick to collect: the answer waits
      // for the first such feed to come back, and the others that come with it. A slow feed's sweep is
      // not waited for: its last positions stand faded, and its sweep's finds come in on the next requests.
      const quick = watched.filter(feed => !feed.failed && !showsPositions(feed, now) && !collectsSlowly(feed) &&
        refresher.refreshing(feed.id)).map(feed => feed.id);
      if (quick.length) {
        const coldWaitMs = options.coldWaitMs ?? COLD_WAIT_MS;
        const came = await refresher.wait(quick, coldWaitMs, true);
        if (came) await refresher.wait(quick, Math.max(0, Math.min(options.joinWaitMs ?? JOIN_WAIT_MS, now + coldWaitMs - Date.now())));
        options.metrics?.recordWait(came);
        snapshot = options.snapshot() ?? snapshot;
      }
      refreshing = new Set(watched.filter(feed => refresher.refreshing(feed.id)).map(feed => feed.id));
      comingSoon = new Set(quick.filter(id => refreshing!.has(id)));
    }
    const answeredAt = Date.now();
    const body = querySnapshot(snapshot, parsed.query, parsed.zoom, answeredAt, { refreshing, idleInView, comingSoon,
      lastSeenMaxAgeMs: options.lastSeenMaxAgeMs });
    const keepUntil = options.retention && answerKeepUntil(snapshot, parsed.query, parsed.zoom, answeredAt, options.retention);
    // The origin only serves authenticated traffic. Public caching is set at the Worker, which keeps
    // an answer holding a capped feed's data no longer than X-Scooter-Keep-Seconds (0: not at all).
    response.writeHead(200, { ...scooterResponseHeaders(body), 'Cache-Control': 'private, no-store',
      'X-Scooter-Public-Cache-Control': scooterResponseHeaders(body)['Cache-Control'],
      ...(keepUntil !== undefined ? { 'X-Scooter-Keep-Seconds': String(Math.max(0, Math.floor((keepUntil - answeredAt) / 1000))) } : {}) });
    response.end(JSON.stringify(body));
  }
  const server = createServer((request, response) => {
    if (options.metrics) {
      const started = performance.now();
      // The path only, without its query, and only a known one.
      const path = (request.url ?? '/').split('?')[0];
      const route = ROUTES.has(path) ? path : 'other';
      response.once('finish', () => options.metrics?.recordRequest(route, response.statusCode, (performance.now() - started) / 1000));
    }
    handle(request, response).catch((error: unknown) => {
      if (response.headersSent) { response.destroy(); return; }
      const unavailable = error instanceof ScooterFeedsUnavailableError;
      if (!unavailable) {
        console.error('Snapshot request failed', error instanceof Error ? error.name : 'UnknownError');
        reportError('request', error);
      }
      response.writeHead(unavailable ? 503 : 500, { 'Retry-After': '30', 'Cache-Control': 'private, no-store' });
      response.end('{"error":"Scooter data is temporarily unavailable."}');
    });
  });
  server.requestTimeout = 10_000;
  server.headersTimeout = 10_000;
  server.timeout = 10_000;
  return server;
}
