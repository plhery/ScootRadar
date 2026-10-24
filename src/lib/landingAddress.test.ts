// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { landingLanguageRedirect } from '@/lib/landingAddress';

const SITE = 'https://scootradar.com';

/** A visit to the site as a browser makes it: typed, unless it says where from. */
function visit(path: string, language: string | null, headers: Record<string, string> = {}, method = 'GET') {
  return landingLanguageRedirect(new Request(`${SITE}${path}`, {
    method,
    headers: { 'Sec-Fetch-Site': 'none', ...(language === null ? {} : { 'Accept-Language': language }), ...headers },
  }));
}

describe('a visit to the root from a browser in another of the site’s languages', () => {
  it('goes on to the landing page in that language, with what the link carries', () => {
    const response = visit('/?utm_source=newsletter&utm_medium=email', 'fr-FR,fr;q=0.9,en;q=0.8');

    expect(response?.status).toBe(302);
    expect(response?.headers.get('location')).toBe(`${SITE}/fr?utm_source=newsletter&utm_medium=email`);
    expect(response?.headers.get('cache-control')).toBe('no-store');
    expect(response?.headers.get('vary')).toContain('Accept-Language');
  });

  it('goes on from a link on another site too', () => {
    const response = visit('/', 'de-CH', { 'Sec-Fetch-Site': 'cross-site', Referer: 'https://www.google.com/' });

    expect(response?.headers.get('location')).toBe(`${SITE}/de`);
  });

  it.each([
    ['ja,fr;q=0.8,en;q=0.5', '/fr'],
    ['sv-SE,it;q=0.7', '/it'],
    ['no', '/nb'],
    ['pt-BR', '/pt'],
  ])('takes the first of the site’s languages the browser asks for: %s', (language, path) => {
    expect(visit('/', language)?.headers.get('location')).toBe(`${SITE}${path}`);
  });

  it('is answered too when only the headers are asked for', () => {
    expect(visit('/', 'fr', {}, 'HEAD')?.status).toBe(302);
  });
});

describe('the root stays English', () => {
  it.each([
    ['English first', 'en-US,fr;q=0.9'],
    ['none of the site’s languages', 'ja,zh-CN;q=0.8'],
    ['any language', '*'],
  ])('for a browser that asks for %s', (_, language) => {
    expect(visit('/', language)).toBeNull();
  });

  it('for a browser or a search engine that asks for no language', () => {
    expect(visit('/', null)).toBeNull();
  });

  it('for a visit from a page of the site, which is how the bar’s English seat leads here', () => {
    expect(visit('/', 'fr', { 'Sec-Fetch-Site': 'same-origin', Referer: `${SITE}/fr` })).toBeNull();
    expect(visit('/', 'fr', { 'Sec-Fetch-Site': 'same-site' })).toBeNull();
  });

  it('for a reload of a page reached from the site, which keeps its referrer', () => {
    expect(visit('/', 'fr', { Referer: `${SITE}/fr` })).toBeNull();
  });

  it('for a browser too old to say where the visit comes from', () => {
    expect(landingLanguageRedirect(new Request(`${SITE}/`, { headers: { 'Accept-Language': 'fr' } }))).toBeNull();
  });

  it('for anything but a page asked for', () => {
    expect(visit('/', 'fr', {}, 'POST')).toBeNull();
  });
});

describe('every other address stays as it is', () => {
  it.each(['/fr', '/de', '/guides', '/guides/e-scooters-bristol', '/map', '/privacy'])('%s', (path) => {
    expect(visit(path, 'fr')).toBeNull();
  });
});
