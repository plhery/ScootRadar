import { afterEach, describe, expect, it, vi } from 'vitest';
import { SITE_DEFAULTS, SITE_SETTING_NAMES, siteSettings } from '@/lib/siteSettings';
import { parseJsonc, wranglerVars } from '@/lib/wranglerVars';

describe('siteSettings', () => {
  it('gives a neutral site of its own where nothing is set', () => {
    expect(siteSettings({})).toEqual(SITE_DEFAULTS);
    expect(SITE_DEFAULTS).toMatchObject({
      SITE_URL: 'http://localhost:3000', SITE_GUIDES: 'off', SITE_MAKER: 'off', CONTACT_EMAIL: '', ANALYTICS_URL: '',
      TURNSTILE_SITE_KEY: '', APP_STORE_ID: '', ANDROID_APP_ID: '', PLAY_TEST_GROUP: '',
    });
    expect(SITE_DEFAULTS.SITE_NAME).not.toMatch(/scootradar/i);
  });

  it('takes scootradar.com\'s from the vars of wrangler.jsonc', () => {
    expect(siteSettings(wranglerVars())).toEqual({
      SITE_URL: 'https://scootradar.com',
      SITE_NAME: 'ScootRadar',
      SITE_GUIDES: 'on',
      SITE_MAKER: 'on',
      CONTACT_EMAIL: 'hello@scootradar.com',
      SOURCE_URL: 'https://github.com/plhery/ScootRadar',
      ANALYTICS_URL: 'https://u.plhery.com/api/send',
      ANALYTICS_WEBSITE_ID: '6e60b4ab-b4ee-4785-9699-a7f32127b358',
      TURNSTILE_SITE_KEY: '0x4AAAAAAGHng4PaY6p_ONop',
      APP_STORE_ID: '6823614854',
      APP_STORE_PROVIDER_TOKEN: '129628155',
      ANDROID_APP_ID: 'com.plhery.scootradar',
      PLAY_TEST_GROUP: 'https://groups.google.com/g/scootradar-android-testers',
    });
  });

  it('keeps an origin of the address, without its last slash', () => {
    expect(siteSettings({ SITE_URL: 'https://example.org/' }).SITE_URL).toBe('https://example.org');
    expect(siteSettings({ SITE_URL: ' https://Example.org ' }).SITE_URL).toBe('https://example.org');
    expect(siteSettings({ SITE_URL: '' }).SITE_URL).toBe('http://localhost:3000');
  });

  it('refuses what it cannot use', () => {
    expect(() => siteSettings({ SITE_URL: 'https://example.org/map' })).toThrow(/origin only/);
    expect(() => siteSettings({ SITE_URL: 'example.org' })).toThrow(/not an address/);
    expect(() => siteSettings({ SITE_URL: 'ftp://example.org' })).toThrow(/http or https/);
    expect(() => siteSettings({ SITE_GUIDES: 'yes' })).toThrow(/"on" or "off"/);
    expect(() => siteSettings({ SITE_GUIDES: true })).toThrow(/must be a string/);
    expect(() => siteSettings({ ANALYTICS_URL: 'http://u.example.org/api/send' })).toThrow(/https address/);
    expect(() => siteSettings({ CONTACT_EMAIL: 'hello' })).toThrow(/email address/);
  });

  it('names every setting the vars of wrangler.jsonc can hold', () => {
    expect(Object.keys(wranglerVars()).filter(name => !(SITE_SETTING_NAMES as string[]).includes(name)))
      .toEqual(['SCOOTER_SNAPSHOT_API_URL', 'WALK_ROUTE_API_URL']);
  });
});

describe('parseJsonc', () => {
  it('reads comments and the last commas as wrangler does, and leaves strings be', () => {
    expect(parseJsonc(`{
      // a comment
      "a": "https://example.org/x", /* another */
      "b": ["//", "/* no */", "quote \\" inside",],
    }`)).toEqual({ a: 'https://example.org/x', b: ['//', '/* no */', 'quote " inside'] });
  });
});

// The site as a copy has it, without scootradar.com's vars: each module read again with nothing set.
describe('without the settings', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function neutral() {
    for (const name of SITE_SETTING_NAMES) vi.stubEnv(name, undefined);
    vi.resetModules();
  }

  it('publishes no guide: none listed, none found, none in the sitemap', async () => {
    await neutral();
    const { GUIDES, GUIDES_SEGMENT, landingGuides, guidesPath } = await import('@/lib/guides');
    const { GUIDES: WRITTEN } = await import('@/guides');
    const { sitePageOf, sitePaths } = await import('@/lib/sitePages');
    const { default: sitemap } = await import('@/app/sitemap');
    expect(WRITTEN.length).toBeGreaterThan(0);
    expect(GUIDES).toEqual([]);
    expect(landingGuides('en', 'All guides')).toEqual([]);
    expect(sitePageOf(['guides'])).toBeNull();
    expect(sitePageOf(['guides', WRITTEN[0].slug])).toBeNull();
    expect(sitePageOf(['de', 'ratgeber'])).toBeNull();
    expect(sitePaths().flat().filter(segment => Object.values(GUIDES_SEGMENT).includes(segment))).toEqual([]);
    const urls = sitemap().map(entry => entry.url);
    expect(urls[0]).toBe('http://localhost:3000/');
    expect(urls.filter(url => url.includes(guidesPath('en')) || url.includes('/ratgeber'))).toEqual([]);
    expect(JSON.stringify(sitemap())).not.toContain('scootradar.com');
  });

  it('shows none of ScootRadar\'s apps, counts nothing and asks no one for a pass', async () => {
    await neutral();
    const { APP_STORE_ON } = await import('@/lib/appStore');
    const { PLAY_TEST_ON } = await import('@/lib/playTest');
    const { ANALYTICS_ENDPOINT, analyticsEnabled } = await import('@/lib/analytics');
    const { TURNSTILE_SITE_KEY, mapPassNow } = await import('@/lib/mapPassClient');
    const { documentContentSecurityPolicy } = await import('@/lib/contentSecurityPolicy');
    const { SITE_NAME, CONTACT_EMAIL } = await import('@/lib/site');
    const { LANDING_COPY } = await import('@/lib/landingCopy');
    expect([APP_STORE_ON, PLAY_TEST_ON, ANALYTICS_ENDPOINT, analyticsEnabled(), TURNSTILE_SITE_KEY, CONTACT_EMAIL])
      .toEqual([false, false, '', false, '', '']);
    await expect(mapPassNow()).resolves.toBe(false);
    expect(documentContentSecurityPolicy({ nonce: 'n', development: false })).not.toContain('plhery');
    expect(SITE_NAME).toBe('Scooter map');
    expect(JSON.stringify(LANDING_COPY)).not.toContain('ScootRadar');
  });

  it('names itself to the services it asks as itself, never as scootradar.com', async () => {
    await neutral();
    const identity = await import('@/lib/serviceIdentity');
    expect(identity).toMatchObject({
      SERVICE_USER_AGENT: 'scooter-map/2.0 (localhost:3000)',
      SERVICE_USER_AGENT_WITH_CONTACT: 'scooter-map/2.0 (localhost:3000)',
      SERVICE_CONTACT: '',
      SERVICE_REFERER: 'http://localhost:3000/',
    });
    const { HOST_HEADERS } = await import('@/lib/scooterFeeds');
    expect(HOST_HEADERS['api.entur.io']).toEqual({ 'ET-Client-Name': 'scooter-map-map' });
  });
});

it('names itself to the services as scootradar.com did before the settings', async () => {
  const identity = await import('@/lib/serviceIdentity');
  expect(identity).toMatchObject({
    SERVICE_USER_AGENT: 'scootradar/2.0 (scootradar.com)',
    SERVICE_USER_AGENT_WITH_CONTACT: 'scootradar/2.0 (scootradar.com; hello@scootradar.com)',
    SERVICE_CONTACT: 'hello@scootradar.com',
    SERVICE_REFERER: 'https://scootradar.com/',
  });
  const { HOST_HEADERS } = await import('@/lib/scooterFeeds');
  expect(HOST_HEADERS['api.entur.io']).toEqual({ 'ET-Client-Name': 'scootradar-map' });
});
