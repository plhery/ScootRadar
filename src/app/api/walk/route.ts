import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextRequest, NextResponse } from 'next/server';
import { haversineM } from '@/lib/geo';
import { rateLimitAllows } from '@/lib/rateLimit';
import { BodyTooLargeError, readJsonBody } from '@/lib/readJsonBody';
import { DEFAULT_WALK_ROUTE_API_URL, parseValhallaWalk, valhallaWalkRequest } from '@/lib/valhalla';
import { WALK_ROUTE_MAX_M, type WalkRouteFailure } from '@/lib/walkRoute';

/**
 * The way on foot from where you are, or from a searched place, to a scooter
 * or a parking bay. The two points come in the body of a request that nothing
 * caches and nothing logs; the routing service is asked from here, so that it
 * learns the points but not who asked.
 */

const UPSTREAM_TIMEOUT_MS = 8_000;
// For all visitors together: FOSSGIS asks for one request a second at most.
const UPSTREAM_LIMIT_KEY = 'walk-route-upstream';
const USER_AGENT = 'scootradar/2.0 (scootradar.com; hello@scootradar.com)';

type Point = [number, number];

function answer(body: object, status: number, retryAfter?: string) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      ...(retryAfter ? { 'Retry-After': retryAfter } : {}),
    },
  });
}

function failure(message: string, status: number, reason: WalkRouteFailure | 'invalid', retryAfter?: string) {
  return answer({ error: message, reason }, status, retryAfter);
}

function asPoint(value: unknown): Point | null {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [lat, lng] = value as unknown[];
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

/** The routing service: WALK_ROUTE_API_URL where it is set, so that another can take over without a release. */
async function routingUrl(): Promise<string> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const configured = (env as CloudflareEnv & Record<string, unknown>).WALK_ROUTE_API_URL;
    if (typeof configured === 'string' && configured.startsWith('https://')) return configured;
  } catch {
    // Outside the Worker: the public service.
  }
  return DEFAULT_WALK_ROUTE_API_URL;
}

export async function POST(request: NextRequest) {
  if (!await rateLimitAllows(request, 'WALK_API_RATE_LIMITER')) {
    return failure('Too many walking routes. Please try again shortly.', 429, 'busy', '60');
  }

  let body: unknown;
  try {
    body = await readJsonBody(request, 1024);
  } catch (error) {
    if (error instanceof BodyTooLargeError) return failure('Walking route request is too large.', 413, 'invalid');
    return failure('Walking route request must be valid JSON.', 400, 'invalid');
  }
  const { from: rawFrom, to: rawTo } = (body && typeof body === 'object' ? body : {}) as { from?: unknown; to?: unknown };
  const from = asPoint(rawFrom);
  const to = asPoint(rawTo);
  if (!from || !to) return failure('A walking route needs two points, each [lat, lng].', 400, 'invalid');
  if (haversineM(from[0], from[1], to[0], to[1]) > WALK_ROUTE_MAX_M) {
    return failure('Too far to walk.', 422, 'too_far');
  }

  if (!await rateLimitAllows(request, 'WALK_UPSTREAM_RATE_LIMITER', UPSTREAM_LIMIT_KEY)) {
    return failure('Walking routes are busy. Please try again shortly.', 503, 'busy', '5');
  }

  try {
    const response = await fetch(await routingUrl(), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        Referer: 'https://scootradar.com/',
      },
      body: JSON.stringify(valhallaWalkRequest(from, to)),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
    if (response.status === 429) return failure('Walking routes are busy. Please try again shortly.', 503, 'busy', '30');
    // Valhalla says why it found no way in the body of a 400.
    if (!response.ok && response.status !== 400) return failure('Walking routes are temporarily unavailable.', 502, 'failed', '30');

    const walk = parseValhallaWalk(await response.json().catch(() => null));
    if (walk === 'no_route') return failure('No walking route between these points.', 422, 'no_route');
    if (!walk) return failure('Walking routes returned an invalid response.', 502, 'failed');
    return answer(walk, 200);
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    return failure(
      timedOut ? 'Walking route timed out.' : 'Walking routes are temporarily unavailable.',
      timedOut ? 504 : 502,
      'failed',
      '30'
    );
  }
}
