import { describe, expect, it } from 'vitest';
import { legacyHostRedirect } from '@/lib/legacyHost';

describe.each(['zurich-scooter.plhery.com', 'swiss-scooters.plhery.com', 'scooters.plhery.com'])('legacy hostname compatibility: %s', (hostname) => {
  it('redirects browser routes to the canonical hostname', () => {
    const response = legacyHostRedirect(new Request(
      `https://${hostname}/privacy?lang=fr`
    ));

    expect(response?.status).toBe(308);
    expect(response?.headers.get('location')).toBe(
      'https://scootradar.com/privacy?lang=fr'
    );
  });

  it.each(['scooters?lat=47.37&lng=8.54', 'geocode?q=Paris'])('keeps legacy API route %s available for installed clients', (route) => {
    const response = legacyHostRedirect(new Request(
      `https://${hostname}/api/${route}`
    ));

    expect(response).toBeNull();
  });

  it('serves service-worker updates on their original origin', () => {
    expect(legacyHostRedirect(new Request(`https://${hostname}/sw.js`))).toBeNull();
  });
});

describe.each(['zurich-scooter.plhery.com', 'swiss-scooters.plhery.com'])('a host that only had the map: %s', (hostname) => {
  it('sends the root, which was the map, to where the map is now', () => {
    const response = legacyHostRedirect(new Request(`https://${hostname}/?origin=47.37,8.54`));

    expect(response?.headers.get('location')).toBe('https://scootradar.com/map?origin=47.37,8.54');
  });
});

// A request as Cloudflare hands it on, with the TLS version of the connection.
const edge = (url: string, tlsVersion: string) => Object.assign(new Request(url), { cf: { tlsVersion } });

describe('the canonical hostname', () => {
  it('is left unchanged', () => {
    expect(legacyHostRedirect(edge('https://scootradar.com/privacy', 'TLSv1.3'))).toBeNull();
  });

  it('is only served over HTTPS', () => {
    const response = legacyHostRedirect(edge('http://scootradar.com/map?lat=47.37', ''));

    expect(response?.status).toBe(308);
    expect(response?.headers.get('location')).toBe('https://scootradar.com/map?lat=47.37');
  });

  it('is served as it is in the local preview, which presents it over HTTP but with TLS', () => {
    expect(legacyHostRedirect(edge('http://scootradar.com/map', 'TLSv1.3'))).toBeNull();
    expect(legacyHostRedirect(new Request('http://scootradar.com/map'))).toBeNull();
  });

  it('is where www leads, whatever the path, the API and the service worker too', () => {
    for (const path of ['/', '/de', '/api/scooters?zoom=12', '/sw.js']) {
      expect(legacyHostRedirect(new Request(`http://www.scootradar.com${path}`))?.headers.get('location'))
        .toBe(`https://scootradar.com${path}`);
    }
  });

  it('keeps its landing page at the root of the last address', () => {
    const response = legacyHostRedirect(new Request('https://scooters.plhery.com/'));

    expect(response?.headers.get('location')).toBe('https://scootradar.com/');
  });

  it('leaves a local preview alone', () => {
    expect(legacyHostRedirect(new Request('http://localhost:3100/map'))).toBeNull();
  });
});
