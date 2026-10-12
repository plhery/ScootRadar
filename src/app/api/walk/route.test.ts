import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  rateLimitAllows: vi.fn(),
  getCloudflareContext: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({ rateLimitAllows: mocks.rateLimitAllows }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: mocks.getCloudflareContext }));

import { POST } from '@/app/api/walk/route';
import { DEFAULT_WALK_ROUTE_API_URL, valhallaWalkRequest } from '@/lib/valhalla';

type Point = [number, number];

const HB: Point = [47.3779, 8.5403];
const BELLEVUE: Point = [47.3667, 8.545];
const WINTERTHUR: Point = [47.4997, 8.7241];
// Zürich HB, north, then east: encoded at six decimals.
const SHAPE = 'g_tjyAg_jhOo}@??w|A';
const SHAPE_POINTS = [[47.3769, 8.5417], [47.3779, 8.5417], [47.3779, 8.5432]];
const VALHALLA_TRIP = { trip: { summary: { length: 0.234, has_ferry: false }, legs: [{ shape: SHAPE }] } };

function walkRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('https://example.com/api/walk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function stubValhalla(body: unknown, status = 200) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    void input;
    void init;
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function expectUncached(response: Response) {
  expect(response.headers.get('cache-control')).toContain('no-store');
}

beforeEach(() => {
  mocks.rateLimitAllows.mockResolvedValue(true);
  mocks.getCloudflareContext.mockResolvedValue({ env: {} });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/walk', () => {
  it('returns 429 before reading the body when the client asks too often', async () => {
    mocks.rateLimitAllows.mockResolvedValue(false);
    const fetchMock = stubValhalla(VALHALLA_TRIP);
    const request = walkRequest({ from: HB, to: BELLEVUE });

    const response = await POST(request);

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    expectUncached(response);
    await expect(response.json()).resolves.toMatchObject({ reason: 'busy' });
    expect(request.bodyUsed).toBe(false);
    expect(mocks.rateLimitAllows).toHaveBeenCalledOnce();
    expect(mocks.rateLimitAllows).toHaveBeenCalledWith(request, 'WALK_API_RATE_LIMITER');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['invalid JSON', '{'],
    ['nothing', null],
    ['no points', {}],
    ['a list', [HB, BELLEVUE]],
    ['no end', { from: HB }],
    ['a latitude past the pole', { from: [91, 8.5403], to: BELLEVUE }],
    ['a longitude past the date line', { from: HB, to: [47.3667, 181] }],
    ['a point in text', { from: ['47.3779', '8.5403'], to: BELLEVUE }],
    ['a point with a height', { from: [...HB, 408], to: BELLEVUE }],
    ['a point as an object', { from: { lat: 47.3779, lng: 8.5403 }, to: BELLEVUE }],
  ])('returns 400 for %s without asking for a way', async (_label, body) => {
    const fetchMock = stubValhalla(VALHALLA_TRIP);

    const response = await POST(walkRequest(body));

    expect(response.status).toBe(400);
    expectUncached(response);
    await expect(response.json()).resolves.toMatchObject({ reason: 'invalid' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 413 for a body over a kilobyte', async () => {
    const fetchMock = stubValhalla(VALHALLA_TRIP);

    const response = await POST(walkRequest({ from: HB, to: BELLEVUE, note: 'x'.repeat(2_000) }));

    expect(response.status).toBe(413);
    expectUncached(response);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 422 for a walk of more than 10 km without asking for it', async () => {
    const fetchMock = stubValhalla(VALHALLA_TRIP);

    const response = await POST(walkRequest({ from: HB, to: WINTERTHUR }));

    expect(response.status).toBe(422);
    expectUncached(response);
    await expect(response.json()).resolves.toMatchObject({ reason: 'too_far' });
    expect(fetchMock).not.toHaveBeenCalled();
    // Nor counting it against the routing service.
    expect(mocks.rateLimitAllows).toHaveBeenCalledOnce();
  });

  it('returns 503 when all visitors together have asked the routing service enough', async () => {
    mocks.rateLimitAllows.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const fetchMock = stubValhalla(VALHALLA_TRIP);
    const request = walkRequest({ from: HB, to: BELLEVUE });

    const response = await POST(request);

    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('5');
    expectUncached(response);
    await expect(response.json()).resolves.toMatchObject({ reason: 'busy' });
    expect(mocks.rateLimitAllows).toHaveBeenLastCalledWith(request, 'WALK_UPSTREAM_RATE_LIMITER', 'walk-route-upstream');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the way and its length', async () => {
    stubValhalla(VALHALLA_TRIP);

    const response = await POST(walkRequest({ from: HB, to: BELLEVUE }));

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    await expect(response.json()).resolves.toEqual({ path: SHAPE_POINTS, distanceM: 234 });
  });

  it.each([
    ['a way by ferry', 200, { trip: { summary: { length: 2.4, has_ferry: true }, legs: [{ shape: SHAPE }] } }],
    ['no path joining the points', 400, { error_code: 442, error: 'No path could be found for input', status_code: 400 }],
  ])('returns 422 for %s', async (_label, status, body) => {
    stubValhalla(body, status);

    const response = await POST(walkRequest({ from: HB, to: BELLEVUE }));

    expect(response.status).toBe(422);
    expectUncached(response);
    await expect(response.json()).resolves.toMatchObject({ reason: 'no_route' });
  });

  it('returns 503 when the routing service is busy', async () => {
    stubValhalla('', 429);

    const response = await POST(walkRequest({ from: HB, to: BELLEVUE }));

    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('30');
    expectUncached(response);
    await expect(response.json()).resolves.toMatchObject({ reason: 'busy' });
  });

  it.each([
    ['fails', 500, ''],
    ['answers nonsense', 200, 'not json'],
    ['answers with another error', 400, { error_code: 100, error: 'Failed to parse json request' }],
  ])('returns 502 when the routing service %s', async (_label, status, body) => {
    stubValhalla(body, status);

    const response = await POST(walkRequest({ from: HB, to: BELLEVUE }));

    expect(response.status).toBe(502);
    expectUncached(response);
    await expect(response.json()).resolves.toMatchObject({ reason: 'failed' });
  });

  it('returns 502 when the routing service cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed'); }));

    const response = await POST(walkRequest({ from: HB, to: BELLEVUE }));

    expect(response.status).toBe(502);
    expectUncached(response);
  });

  it('returns 504 when the routing service takes more than eight seconds', async () => {
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new DOMException('The operation was aborted due to timeout', 'TimeoutError');
    }));

    const response = await POST(walkRequest({ from: HB, to: BELLEVUE }));

    expect(timeout).toHaveBeenCalledWith(8_000);
    expect(response.status).toBe(504);
    expect(response.headers.get('retry-after')).toBe('30');
    expectUncached(response);
    await expect(response.json()).resolves.toMatchObject({ reason: 'failed' });
  });

  it('asks the routing service for the walk without saying who asked', async () => {
    const fetchMock = stubValhalla(VALHALLA_TRIP);

    await POST(walkRequest({ from: HB, to: BELLEVUE }, {
      'CF-Connecting-IP': '203.0.113.7',
      'X-Forwarded-For': '203.0.113.7, 198.51.100.1',
      'X-Real-IP': '203.0.113.7',
      'True-Client-IP': '203.0.113.7',
      Forwarded: 'for=203.0.113.7',
      Cookie: 'session=abc',
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X)',
    }));

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(DEFAULT_WALK_ROUTE_API_URL);
    expect(init?.method).toBe('POST');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const headers = new Headers(init?.headers);
    expect(headers.get('user-agent')).toBe('scootradar/2.0 (scootradar.com; hello@scootradar.com)');
    expect(headers.get('referer')).toBe('https://scootradar.com/');
    for (const name of ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip', 'true-client-ip', 'forwarded', 'cookie']) {
      expect(headers.has(name)).toBe(false);
    }
    expect(JSON.parse(String(init?.body))).toEqual(valhallaWalkRequest(HB, BELLEVUE));
    expect(String(init?.body)).not.toContain('203.0.113.7');
  });

  it.each([
    ['https://valhalla.example.ch/route', 'https://valhalla.example.ch/route'],
    ['http://valhalla.example.ch/route', DEFAULT_WALK_ROUTE_API_URL],
    ['', DEFAULT_WALK_ROUTE_API_URL],
    [undefined, DEFAULT_WALK_ROUTE_API_URL],
  ])('asks the routing service set in WALK_ROUTE_API_URL only over HTTPS (%s)', async (configured, expected) => {
    mocks.getCloudflareContext.mockResolvedValue({ env: { WALK_ROUTE_API_URL: configured } });
    const fetchMock = stubValhalla(VALHALLA_TRIP);

    await POST(walkRequest({ from: HB, to: BELLEVUE }));

    expect(fetchMock.mock.calls[0][0]).toBe(expected);
  });

  it('asks the public routing service outside the Worker', async () => {
    mocks.getCloudflareContext.mockRejectedValue(new Error('getCloudflareContext has been called outside the Worker'));
    const fetchMock = stubValhalla(VALHALLA_TRIP);

    const response = await POST(walkRequest({ from: HB, to: BELLEVUE }));

    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe(DEFAULT_WALK_ROUTE_API_URL);
  });

  it('takes no GET: the points never go in a URL', async () => {
    const route: Record<string, unknown> = await import('@/app/api/walk/route');
    expect(route.GET).toBeUndefined();
    expect(route.POST).toBe(POST);
  });
});
