import { describe, expect, it, vi } from 'vitest';
import { holdsMapPass, MAP_PASS_COOKIE } from './mapPass';
import { answerMapPass } from './mapPassEndpoint';

const env = () => ({ TURNSTILE_SECRET_KEY: 'turnstile-secret', MAP_PASS_SECRET: 'pass-secret',
  SCOOTER_API_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) } });
const ask = (body: unknown = { token: 'a-token' }, method = 'POST') => new Request('https://scootradar.com/api/pass', {
  method, headers: { 'cf-connecting-ip': '2001:db8:1:2:3:4:5:6', 'Content-Type': 'application/json' },
  ...(method === 'POST' && { body: typeof body === 'string' ? body : JSON.stringify(body) }) });
const verdict = (fields: Record<string, unknown>) => vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(fields));

describe('map pass endpoint', () => {
  it('sets the pass for the visitor\'s network once Cloudflare has checked the token for this site and the map', async () => {
    const fetcher = verdict({ success: true, hostname: 'scootradar.com', action: 'map', challenge_ts: '2026-11-18T21:00:00Z' });
    const response = await answerMapPass(ask(), env());
    expect(response.status).toBe(204);
    const [url, init] = fetcher.mock.calls[0];
    expect(String(url)).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    expect(Object.fromEntries(new URLSearchParams(String(init?.body)))).toEqual({ secret: 'turnstile-secret', response: 'a-token',
      remoteip: '2001:db8:1:2:3:4:5:6' });
    const set = response.headers.get('Set-Cookie')!;
    expect(set).toMatch(new RegExp(`^${MAP_PASS_COOKIE}=\\d{10}\\.[\\w-]{43}; Max-Age=86400; Path=/; Secure; HttpOnly; SameSite=Strict$`));
    const cookie = set.split(';')[0];
    // Held anywhere in the visitor's /64, and nowhere else.
    expect(await holdsMapPass(cookie, 'pass-secret', '2001:db8:1:2::')).toBe(true);
    expect(await holdsMapPass(cookie, 'pass-secret', '2001:db8:1:3::')).toBe(false);
  });

  it('refuses a token Cloudflare did not pass, or passed for another site or widget action', async () => {
    const logged = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const fields of [{ success: false, 'error-codes': ['timeout-or-duplicate'] }, { success: true, hostname: 'example.com', action: 'map' },
      { success: true, hostname: 'scootradar.com', action: 'login' }]) {
      verdict(fields);
      const response = await answerMapPass(ask(), env());
      expect(response.status).toBe(403);
      expect(response.headers.has('Set-Cookie')).toBe(false);
    }
    expect(JSON.parse(logged.mock.calls[0][0])).toEqual({ event: 'map_pass_refused', errors: ['timeout-or-duplicate'] });
  });

  it('asks Cloudflare nothing for a request that is not one, and says when passes are not set up or limited', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch');
    expect((await answerMapPass(ask(undefined, 'GET'), env())).status).toBe(405);
    for (const body of ['not json', {}, { token: 7 }, { token: 'x'.repeat(2049) }]) expect((await answerMapPass(ask(body), env())).status).toBe(400);
    expect((await answerMapPass(ask(), { ...env(), MAP_PASS_SECRET: undefined })).status).toBe(503);
    const limited = env();
    limited.SCOOTER_API_RATE_LIMITER.limit.mockResolvedValue({ success: false });
    const response = await answerMapPass(ask(), limited);
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(limited.SCOOTER_API_RATE_LIMITER.limit).toHaveBeenCalledWith({ key: '2001:db8:1:2::' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('answers 503 when Cloudflare cannot be asked', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('The operation timed out.', 'TimeoutError'));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await answerMapPass(ask(), env())).status).toBe(503);
    expect(JSON.parse(logged.mock.calls[0][0])).toEqual({ event: 'map_pass_unverified', error: 'TimeoutError' });
  });
});
