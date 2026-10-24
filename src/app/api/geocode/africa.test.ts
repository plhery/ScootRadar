import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { searchRegionalScooterCities } from '@/lib/regionalScooterSystems';

vi.mock('@/lib/rateLimit', () => ({ rateLimitAllows: async () => true }));
vi.mock('@opennextjs/cloudflare', () => ({ getCloudflareContext: async () => { throw new Error('outside Worker'); } }));
const { POST } = await import('./route');
afterEach(() => vi.unstubAllGlobals());

it('finds the reviewed resort alias and searches addresses in South Africa', async () => {
  expect(searchRegionalScooterCities('Club Mykonos').some(city => city.display_name === 'Langebaan, South Africa')).toBe(true);
  const fetch = vi.fn<typeof globalThis.fetch>(async () => Response.json({ features: [{
    properties: { osm_key: 'highway', osm_value: 'residential', name: 'Mykonos Access Road',
      housenumber: '1', city: 'Langebaan', postcode: '7357', country: 'South Africa', countrycode: 'ZA' },
    geometry: { coordinates: [18.043, -33.047] },
  }] }));
  vi.stubGlobal('fetch', fetch);
  const response = await POST(new NextRequest('https://example.com/api/geocode', { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: 'Mykonos Access Road', lang: 'en', home: 'ZA', near: [-33.047, 18.043] }) }));
  const rows = await response.json() as { title: string }[];
  expect(rows.some(row => row.title.includes('Mykonos Access Road'))).toBe(true);
  expect(fetch).toHaveBeenCalled();
  const url = new URL(String(fetch.mock.calls[0][0]));
  expect(url.hostname).toBe('photon.komoot.io');
  expect(url.searchParams.get('bbox')).toBe('10,-35,41,-15');
});
