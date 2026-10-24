import { describe, expect, it, vi } from 'vitest';
import { ClientCredentialsToken, UpstreamTokenError } from '@/lib/clientCredentialsToken';
import { UpstreamHttpError, UpstreamJsonCache, type UpstreamJsonOptions } from '@/lib/upstreamJsonCache';

const tokenUrl = 'https://auth.example.com/token';
const credentials = () => ({ clientId: 'map-client', clientSecret: 'very-secret' });

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

/** A token server handing out "t1", "t2"… valid `lifetime` seconds each. */
function tokenServer(lifetime = 3_600) {
  let issued = 0;
  return vi.fn(async () => jsonResponse({ access_token: `t${++issued}`, expires_in: lifetime, token_type: 'Bearer' }));
}

describe('ClientCredentialsToken', () => {
  it('asks for a token with the client credentials and keeps it until shortly before it expires', async () => {
    let now = 0;
    const fetcher = tokenServer(600);
    const token = new ClientCredentialsToken({ tokenUrl, credentials, fetcher, now: () => now, renewBeforeSeconds: 60 });

    await expect(token.authorization()).resolves.toBe('Bearer t1');
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(tokenUrl);
    expect(init.method).toBe('POST');
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual(
      { grant_type: 'client_credentials', client_id: 'map-client', client_secret: 'very-secret' });

    now = 539_000;
    await expect(token.authorization()).resolves.toBe('Bearer t1');
    now = 540_000;
    await expect(token.authorization()).resolves.toBe('Bearer t2');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(token.issued).toBe(2);
  });

  it('asks once for every request that needs a token at the same time', async () => {
    let answer: ((response: Response) => void) | undefined;
    const fetcher = vi.fn(() => new Promise<Response>(resolve => { answer = resolve; }));
    const token = new ClientCredentialsToken({ tokenUrl, credentials, fetcher });

    const waiting = Promise.all([token.authorization(), token.authorization(), token.authorization()]);
    answer?.(jsonResponse({ access_token: 'shared', expires_in: 3_600 }));
    await expect(waiting).resolves.toEqual(['Bearer shared', 'Bearer shared', 'Bearer shared']);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('renews only the token refused, not one received since', async () => {
    const fetcher = tokenServer();
    const token = new ClientCredentialsToken({ tokenUrl, credentials, fetcher });
    const first = await token.authorization();
    token.renew(first);
    const second = await token.authorization();
    expect(second).toBe('Bearer t2');
    // A request that went out with the first token and comes back 401 late keeps the second.
    token.renew(first);
    await expect(token.authorization()).resolves.toBe('Bearer t2');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('fails without credentials, and names neither the secret nor the reply when refused', async () => {
    const fetcher = vi.fn(async () => jsonResponse({ error: 'invalid_client', detail: 'very-secret' }, 401));
    const missing = new ClientCredentialsToken({ tokenUrl, credentials: () => ({ clientId: 'map-client' }), fetcher });
    await expect(missing.authorization()).rejects.toThrow('No client credentials for auth.example.com');
    expect(fetcher).not.toHaveBeenCalled();

    const refused = new ClientCredentialsToken({ tokenUrl, credentials, fetcher });
    const error = await refused.authorization().catch((failure: unknown) => failure);
    expect(error).toBeInstanceOf(UpstreamTokenError);
    expect((error as Error).message).toBe('Token request to auth.example.com failed with HTTP 401');
    expect((error as Error).message).not.toContain('secret');

    // After a failure, the next request asks again.
    fetcher.mockImplementationOnce(async () => jsonResponse({ access_token: 'late', expires_in: 60 }));
    await expect(refused.authorization()).resolves.toBe('Bearer late');
  });
});

describe('UpstreamJsonCache with a token', () => {
  const options: UpstreamJsonOptions = { headers: { Accept: 'application/json' }, freshSeconds: 30, staleIfErrorSeconds: 300, timeoutMs: 1_000 };

  function authorizationOf(call: unknown[]): string | undefined {
    return ((call[1] as RequestInit).headers as Record<string, string>).Authorization;
  }

  it('sends the token, and after a 401 renews it and asks once more', async () => {
    const auth = new ClientCredentialsToken({ tokenUrl, credentials, fetcher: tokenServer() });
    const feed = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) =>
      (init?.headers as Record<string, string>).Authorization === 'Bearer t1' ? new Response('', { status: 401 }) : jsonResponse({ ok: true }));
    const cache = new UpstreamJsonCache({ fetcher: feed });

    await expect(cache.fetch('https://feeds.example.com/vehicle_status.json', { ...options, auth }))
      .resolves.toMatchObject({ data: { ok: true }, stale: false });
    expect(feed.mock.calls.map(authorizationOf)).toEqual(['Bearer t1', 'Bearer t2']);
    expect(feed.mock.calls[0][1]?.headers).toMatchObject({ Accept: 'application/json' });
    expect(cache.requests.status).toBe(2);
  });

  it('gives up after a second 401 rather than asking for tokens on and on', async () => {
    const tokens = tokenServer();
    const auth = new ClientCredentialsToken({ tokenUrl, credentials, fetcher: tokens });
    const feed = vi.fn(async () => new Response('', { status: 401 }));
    const cache = new UpstreamJsonCache({ fetcher: feed });

    await expect(cache.fetch('https://feeds.example.com/vehicle_status.json', { ...options, auth }))
      .rejects.toEqual(new UpstreamHttpError(401, 'feeds.example.com'));
    expect(feed).toHaveBeenCalledTimes(2);
    expect(tokens).toHaveBeenCalledTimes(2);
  });

  it('serves the last document when no token can be had', async () => {
    let now = 0;
    let refuse = false;
    const tokens = vi.fn(async () => refuse ? new Response('', { status: 503 }) : jsonResponse({ access_token: 't', expires_in: 60 }));
    const auth = new ClientCredentialsToken({ tokenUrl, credentials, fetcher: tokens, now: () => now, renewBeforeSeconds: 0 });
    const cache = new UpstreamJsonCache({ fetcher: vi.fn(async () => jsonResponse({ version: 1 })), now: () => now });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await cache.fetch('https://feeds.example.com/vehicle_status.json', { ...options, auth });
    now = 61_000;
    refuse = true;
    await expect(cache.fetch('https://feeds.example.com/vehicle_status.json', { ...options, auth }))
      .resolves.toMatchObject({ data: { version: 1 }, stale: true });
    expect(JSON.parse(warn.mock.calls[0][0] as string)).toMatchObject({ event: 'upstream_stale_fallback', errorType: 'UpstreamTokenError' });
    warn.mockRestore();
  });
});
