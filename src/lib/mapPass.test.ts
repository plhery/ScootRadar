import { describe, expect, it } from 'vitest';
import { holdsMapPass, issueMapPass, MAP_PASS_COOKIE, MAP_PASS_SECONDS, mapPassCookie } from './mapPass';
import { isAppUserAgent, parseScooterClient, scooterClient } from './scooterClient';

const secret = 'a-test-secret-of-the-worker-that-signs-map-passes';
const now = Date.UTC(2026, 10, 18, 21, 0);
const cookie = (value: string) => `theme=dark; ${MAP_PASS_COOKIE}=${value}; other=1`;

describe('map pass', () => {
  it('is held on the network it was given to until it expires, and holds no identifier', async () => {
    const value = await issueMapPass(secret, '192.0.2.1', now);
    expect(value).toMatch(/^\d{10}\.[A-Za-z0-9_-]{43}$/);
    expect(Number(value.split('.')[0])).toBe(now / 1000 + MAP_PASS_SECONDS);
    // Two passes of the same second on the same network are the same: nothing tells their holders apart.
    expect(await issueMapPass(secret, '192.0.2.1', now)).toBe(value);
    expect(await holdsMapPass(cookie(value), secret, '192.0.2.1', now + 60_000)).toBe(true);
    expect(await holdsMapPass(cookie(value), secret, '2001:db8:1:2::', now + 60_000)).toBe(false);
    expect(await holdsMapPass(cookie(value), secret, '192.0.2.1', now + MAP_PASS_SECONDS * 1000)).toBe(false);
  });

  it('is not held when forged, signed with another key, or without a key to check it', async () => {
    const value = await issueMapPass(secret, '192.0.2.1', now);
    const [expiry, signature] = value.split('.');
    expect(await holdsMapPass(cookie(`${Number(expiry) + 3600}.${signature}`), secret, '192.0.2.1', now)).toBe(false);
    expect(await holdsMapPass(cookie(`${expiry}.${signature.slice(1)}A`), secret, '192.0.2.1', now)).toBe(false);
    expect(await holdsMapPass(cookie(value), 'another-secret', '192.0.2.1', now)).toBe(false);
    expect(await holdsMapPass(cookie(value), undefined, '192.0.2.1', now)).toBe(false);
    expect(await holdsMapPass(null, secret, '192.0.2.1', now)).toBe(false);
    // A pass made to last longer than a day is no pass of ours.
    const later = await issueMapPass(secret, '192.0.2.1', now + 2 * MAP_PASS_SECONDS * 1000);
    expect(await holdsMapPass(cookie(later), secret, '192.0.2.1', now)).toBe(false);
  });

  it('is a cookie for this site alone, out of the page scripts\' reach, for a day', () => {
    expect(mapPassCookie('1.x')).toBe(`${MAP_PASS_COOKIE}=1.x; Max-Age=86400; Path=/; Secure; HttpOnly; SameSite=Strict`);
  });
});

describe('scooter client', () => {
  it('is verified with a pass, a map naming its view, an app by its user agent, and anything else other', () => {
    expect(scooterClient({ pass: true, view: false, userAgent: 'curl/8' })).toBe('verified');
    expect(scooterClient({ pass: false, view: true, userAgent: 'Mozilla/5.0' })).toBe('map');
    expect(scooterClient({ pass: false, view: false, userAgent: 'ScootRadar/2437 CFNetwork/3896.200.61 Darwin/27.2.0' })).toBe('app');
    expect(scooterClient({ pass: false, view: false, userAgent: 'okhttp/5.5.1' })).toBe('app');
    expect(scooterClient({ pass: false, view: false, userAgent: 'NRW-availability-pilot/1.0' })).toBe('other');
    expect(scooterClient({ pass: false, view: false, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })).toBe('other');
    expect(scooterClient({ pass: false, view: false, userAgent: null })).toBe('other');
    expect(isAppUserAgent('Mozilla/5.0 ScootRadar/1')).toBe(false);
  });

  it('is read back by the cache, a map when the header is missing or unknown', () => {
    expect(parseScooterClient('other')).toBe('other');
    expect(parseScooterClient('verified')).toBe('verified');
    expect(parseScooterClient(undefined)).toBe('map');
    expect(parseScooterClient('admin')).toBe('map');
    expect(parseScooterClient(['other', 'other'])).toBe('map');
  });
});
