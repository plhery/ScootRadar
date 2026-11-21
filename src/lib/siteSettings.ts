// The settings a deployment of the website is built with: where it lives, what it is called, what of
// ScootRadar's own it shows, and the services it uses. Each is a var of wrangler.jsonc, which the
// build reads (next.config.ts) and the Worker is given when it runs, so the pages and worker.ts
// always say the same (README.md, "Run your own"). One left out takes its default here: a site on
// this computer, named for what it shows, without the guides, the apps or the analytics, which are
// ScootRadar's and not the code's (TRADEMARKS.md).

export const SITE_DEFAULTS = {
  /** The origin the site is served from: its own links, the addresses search engines are given, the checks of where a request came from. */
  SITE_URL: 'http://localhost:3000',
  /** What the site calls itself, in its words, its titles and what it tells search engines and the services it asks. */
  SITE_NAME: 'Scooter map',
  /** `on` publishes the guides of src/guides; `off` leaves them out of the site, its sitemap and its links. */
  SITE_GUIDES: 'off',
  /** `on` ends each page with the line on who makes ScootRadar and their other sites (landingCopy.ts, makerLinks). */
  SITE_MAKER: 'off',
  /** Where the privacy notice and the accessibility statement send questions, and what the site gives services as its contact. None: neither says. */
  CONTACT_EMAIL: '',
  /** The source code, which the site links to and names in the attribution of its data. */
  SOURCE_URL: 'https://github.com/plhery/ScootRadar',
  /** Umami's address for events (…/api/send) and the website's id there. Without both, nothing is counted. */
  ANALYTICS_URL: '',
  ANALYTICS_WEBSITE_ID: '',
  /** The site key of the Cloudflare Turnstile widget that gives the web map its pass (DEPLOY.md, "Map passes"). None: the map never asks for one. */
  TURNSTILE_SITE_KEY: '',
  /** The iPhone app's Apple ID, and the token of the account publishing it, for the links to it. No ID: the site shows no iPhone app. */
  APP_STORE_ID: '',
  APP_STORE_PROVIDER_TOKEN: '',
  /** The Android app's id on Google Play, and the Google Group its closed test admits. Without both, the site invites no one to the test. */
  ANDROID_APP_ID: '',
  PLAY_TEST_GROUP: '',
};

export type SiteSettingName = keyof typeof SITE_DEFAULTS;
export type SiteSettings = Record<SiteSettingName, string>;
export const SITE_SETTING_NAMES = Object.keys(SITE_DEFAULTS) as SiteSettingName[];

const SWITCHES: readonly SiteSettingName[] = ['SITE_GUIDES', 'SITE_MAKER'];
const ADDRESSES: readonly SiteSettingName[] = ['SOURCE_URL', 'ANALYTICS_URL', 'PLAY_TEST_GROUP'];

/** The settings from a deployment's vars, each checked, and the defaults for those it leaves out. */
export function siteSettings(vars: Readonly<Record<string, unknown>> = {}): SiteSettings {
  const settings = { ...SITE_DEFAULTS };
  for (const name of SITE_SETTING_NAMES) {
    const set = vars[name];
    if (set === undefined || set === null) continue;
    if (typeof set !== 'string') throw new Error(`${name} must be a string, not ${JSON.stringify(set)}`);
    settings[name] = set.trim();
  }
  settings.SITE_URL = siteOrigin(settings.SITE_URL || SITE_DEFAULTS.SITE_URL);
  if (!settings.SITE_NAME) settings.SITE_NAME = SITE_DEFAULTS.SITE_NAME;
  for (const name of SWITCHES) {
    if (settings[name] === '') settings[name] = SITE_DEFAULTS[name];
    if (settings[name] !== 'on' && settings[name] !== 'off') throw new Error(`${name} is "on" or "off", not "${settings[name]}"`);
  }
  for (const name of ADDRESSES) {
    if (settings[name] && !/^https:\/\/[^\s/]+/.test(settings[name])) throw new Error(`${name} is an https address, not "${settings[name]}"`);
  }
  if (settings.CONTACT_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.CONTACT_EMAIL)) {
    throw new Error(`CONTACT_EMAIL is an email address, not "${settings.CONTACT_EMAIL}"`);
  }
  return settings;
}

/** An origin, as https://example.org: no path, no query and no slash at the end. */
export function siteOrigin(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`SITE_URL is not an address: "${value}"`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error(`SITE_URL is http or https, not ${url.protocol}`);
  if (url.pathname !== '/' || url.search || url.hash || url.username || url.password) {
    throw new Error(`SITE_URL is an origin only, as https://example.org, not "${value}"`);
  }
  return url.origin;
}
