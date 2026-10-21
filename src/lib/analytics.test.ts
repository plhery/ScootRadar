// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsEnabled, safeAnalyticsData, visitSource } from './analytics';

const location = { hostname: 'scootradar.com', pathname: '/map', search: '?lat=47.3&lng=8.5', hash: '#private' };
beforeEach(() => {
  vi.resetModules();
  localStorage.clear();
  vi.stubGlobal('location', location);
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
});
afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(document, 'referrer', { value: '', configurable: true });
});

describe('analytics privacy boundary', () => {
  it('drops arbitrary data and address-like values', () => {
    expect(safeAnalyticsData({ provider: 'lime', value: 40, result: 'timeout',
      ...{ lat: 47.3, address: 'Bahnhofstrasse 1', url: 'https://secret' },
      style: 'some street 123', count: NaN,
    })).toEqual({ provider: 'lime', value: 40, result: 'timeout' });
  });
  it('excludes local development and preview hosts', () => {
    vi.stubGlobal('location', { ...location, hostname: 'localhost' });
    expect(analyticsEnabled()).toBe(false);
    vi.stubGlobal('location', { ...location, hostname: 'preview.workers.dev' });
    expect(analyticsEnabled()).toBe(false);
  });
  it('respects opt-out, Do Not Track and Global Privacy Control', () => {
    expect(analyticsEnabled()).toBe(true);
    localStorage.setItem('umami.disabled', '1');
    expect(analyticsEnabled()).toBe(false);
    localStorage.clear();
    vi.stubGlobal('navigator', { doNotTrack: '1' });
    expect(analyticsEnabled()).toBe(false);
    vi.stubGlobal('navigator', { globalPrivacyControl: true });
    expect(analyticsEnabled()).toBe(false);
  });
  it('sends only safe paths, no queries, referrers or identities of its own, and reuses the session cache', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ cache: 'session-cache' }) });
    vi.stubGlobal('fetch', fetcher);
    const { track } = await import('./analytics');
    track();
    track('rental_open', { provider: 'lime' });
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    const [url, request] = fetcher.mock.calls[1];
    expect(url).toBe('https://u.plhery.com/api/send');
    const body = JSON.parse(request.body);
    expect(body.payload).toMatchObject({ url: '/map', referrer: '', tag: 'web', name: 'rental_open', data: { platform: 'web', provider: 'lime' } });
    expect(request.headers['x-umami-cache']).toBe('session-cache');
    expect(request.credentials).toBe('omit');
    expect(request.referrerPolicy).toBe('no-referrer');
    expect(request.body).not.toMatch(/47\.3|8\.5|private|session-cache/);
    expect(body.payload).not.toHaveProperty('id');
  });
  it('counts each language of the landing page under its own path, and anything unknown under the app', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetcher);
    const { track } = await import('./analytics');
    const sent = async (pathname: string) => {
      vi.stubGlobal('location', { ...location, pathname });
      const calls = fetcher.mock.calls.length;
      track();
      await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(calls + 1));
      return JSON.parse(fetcher.mock.calls[calls][1].body).payload;
    };
    expect(await sent('/')).toMatchObject({ url: '/', title: 'About — ScootRadar' });
    expect(await sent('/de')).toMatchObject({ url: '/de', title: 'About — ScootRadar' });
    expect(await sent('/privacy')).toMatchObject({ url: '/privacy', title: 'Privacy — ScootRadar' });
    expect(await sent('/map')).toMatchObject({ url: '/map', title: 'ScootRadar' });
    expect(await sent('/is')).toMatchObject({ url: '/is', title: 'About — ScootRadar' });
    expect(await sent('/sv')).toMatchObject({ url: '/map', title: 'ScootRadar' });
    expect(await sent('/en/anything')).toMatchObject({ url: '/map', title: 'ScootRadar' });
  });
  it('counts a page of the site under the address and title its layout gives, if it has the form of one', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetcher);
    const { track } = await import('./analytics');
    vi.stubGlobal('location', { ...location, pathname: '/guides/e-scooters-bristol' });
    const guide = { path: '/guides/e-scooters-bristol', title: 'E-scooter hire in Bristol — ScootRadar' };
    track(undefined, {}, guide);
    track('map_open', { result: 'city' }, guide);
    track(undefined, {}, { path: 'https://elsewhere.example/guides', title: 'Elsewhere' });
    track(undefined, {}, { path: '/guides/e-scooters-bristol?from=mail', title: 'Bristol' });
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(4));
    const [view, opened, outside, query] = fetcher.mock.calls.map(call => JSON.parse(call[1].body).payload);
    expect(view).toMatchObject({ url: '/guides/e-scooters-bristol', title: 'E-scooter hire in Bristol — ScootRadar', referrer: '' });
    expect(view).not.toHaveProperty('name');
    expect(opened).toMatchObject({ url: '/guides/e-scooters-bristol', name: 'map_open', data: { result: 'city', platform: 'web' } });
    expect(outside).toMatchObject({ url: '/map', title: 'ScootRadar' });
    expect(query).toMatchObject({ url: '/map', title: 'ScootRadar' });
  });
  it('sends where a visit came from with its first page view only: the linking site by its origin, and the campaign tags', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal('fetch', fetcher);
    vi.stubGlobal('location', { ...location, pathname: '/',
      search: '?lat=47.3&utm_source=newsletter&utm_medium=email&utm_campaign=autumn-26&utm_term=zurich' });
    Object.defineProperty(document, 'referrer', { value: 'https://www.example.org/search?q=private', configurable: true });
    const { track } = await import('./analytics');
    track();
    track('app_open');
    track();
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(3));
    const [first, event, next] = fetcher.mock.calls.map(call => JSON.parse(call[1].body).payload);
    expect(first).toMatchObject({ url: '/?utm_source=newsletter&utm_medium=email&utm_campaign=autumn-26', referrer: 'https://www.example.org/' });
    expect(event).toMatchObject({ url: '/', referrer: '', name: 'app_open' });
    expect(next).toMatchObject({ url: '/', referrer: '' });
    expect(fetcher.mock.calls[0][1].body).not.toMatch(/search|private|47\.3|zurich|utm_term/);
  });
  it('gives a visit without a referrer the AI assistant its link names, and nothing for the site itself or odd tags', () => {
    expect(visitSource('', '?utm_source=chatgpt.com')).toEqual({ referrer: 'https://chatgpt.com/', query: '?utm_source=chatgpt.com' });
    expect(visitSource('', '?utm_source=Perplexity')).toEqual({ referrer: 'https://perplexity.ai/', query: '?utm_source=Perplexity' });
    expect(visitSource('https://www.bing.com/', '?utm_source=chatgpt.com')).toEqual({ referrer: 'https://www.bing.com/', query: '?utm_source=chatgpt.com' });
    expect(visitSource('android-app://com.google.android.googlequicksearchbox/', '')).toEqual({ referrer: 'android-app://com.google.android.googlequicksearchbox/', query: '' });
    expect(visitSource('https://scootradar.com/guides', '')).toEqual({ referrer: '', query: '' });
    expect(visitSource('https://www.scootradar.com/', '')).toEqual({ referrer: '', query: '' });
    expect(visitSource('not an address', `?utm_source=someone%40example.com&utm_medium=a+b&utm_campaign=${'x'.repeat(61)}`))
      .toEqual({ referrer: '', query: '' });
  });
  it('bounds the queue and survives network failures without retries', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetcher);
    const { track } = await import('./analytics');
    for (let i = 0; i < 100; i++) track('refresh');
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(30));
    track('refresh');
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(31));
  });
  it("honors the collector's disabled response", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ disabled: true }) });
    vi.stubGlobal('fetch', fetcher);
    const { track } = await import('./analytics');
    track('app_open');
    track('refresh');
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('drops pending events if the rider opts out before transmission', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const { track } = await import('./analytics');
    track('refresh');
    localStorage.setItem('umami.disabled', '1');
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(fetcher).not.toHaveBeenCalled();
  });

});
