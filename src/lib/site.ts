// Where the site lives and what it is called, for what is said about it to
// search engines and to the pages a link to it is shared on.

import type { Guide } from '@/lib/guides';
import type { LandingLocale } from '@/lib/landingCopy';
import { siteSettings } from './siteSettings';

// Each read is written out: the build puts each setting's value in its place (next.config.ts, `env`), and
// the Worker reads its vars there when it runs.
export const SITE = siteSettings({
  SITE_URL: process.env.SITE_URL,
  SITE_NAME: process.env.SITE_NAME,
  SITE_GUIDES: process.env.SITE_GUIDES,
  SITE_MAKER: process.env.SITE_MAKER,
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
  SOURCE_URL: process.env.SOURCE_URL,
  ANALYTICS_URL: process.env.ANALYTICS_URL,
  ANALYTICS_WEBSITE_ID: process.env.ANALYTICS_WEBSITE_ID,
  TURNSTILE_SITE_KEY: process.env.TURNSTILE_SITE_KEY,
  APP_STORE_ID: process.env.APP_STORE_ID,
  APP_STORE_PROVIDER_TOKEN: process.env.APP_STORE_PROVIDER_TOKEN,
  ANDROID_APP_ID: process.env.ANDROID_APP_ID,
  PLAY_TEST_GROUP: process.env.PLAY_TEST_GROUP,
});

export const SITE_URL = SITE.SITE_URL;
export const SITE_NAME = SITE.SITE_NAME;
/** The site's host name, as scootradar.com. */
export const SITE_HOST = new URL(SITE_URL).hostname;
/** Whether the site publishes the guides (SITE_GUIDES). */
export const GUIDES_PUBLISHED = SITE.SITE_GUIDES === 'on';
/** Where questions go, or '' where the deployment names none (CONTACT_EMAIL). */
export const CONTACT_EMAIL = SITE.CONTACT_EMAIL;
/** The host Umami takes the events at, or '' where nothing is counted (ANALYTICS_URL). */
export const ANALYTICS_SERVICE_HOST = SITE.ANALYTICS_URL && new URL(SITE.ANALYTICS_URL).hostname;

/** The picture a shared link to the map shows, of the English landing page (scripts/generate-share-images.mjs). */
export const MAP_SHARE_IMAGE = {
  url: '/share/en.png',
  width: 1200,
  height: 630,
  alt: 'Every e-scooter on one map: the app at night by Zürich main station, beside the initials of twelve providers.',
};

/** The language and country a shared link names, for each language of the site. */
export const OPEN_GRAPH_LOCALES: Record<LandingLocale, string> = {
  en: 'en_CH',
  de: 'de_CH',
  fr: 'fr_CH',
  it: 'it_CH',
  // The country of each with scooters on the map.
  nl: 'nl_BE',
  nb: 'nb_NO',
  pt: 'pt_PT',
  es: 'es_ES',
  is: 'is_IS',
};

/** The country a guide with no city is about, by its topic. A guide on renting one is about none. */
const TOPIC_COUNTRIES: Readonly<Record<string, string>> = {
  'german-rules': 'DE',
  'swiss-rules': 'CH',
  'swiss-prices': 'CH',
  'uk-law': 'GB',
  'uk-hire': 'GB',
  'french-rules': 'FR',
  'spanish-rules': 'ES',
  'portuguese-rules': 'PT',
  'icelandic-rules': 'IS',
};

/**
 * The language and country a shared link to a guide names: its language, and the country of its city, or of its
 * topic when it has no city. A guide about no country names its language's, as the landing page does.
 */
export function guideOpenGraphLocale(guide: Pick<Guide, 'locale' | 'topic' | 'city'>): string {
  const country = guide.city ? guide.city.split(':')[0].toUpperCase() : TOPIC_COUNTRIES[guide.topic];
  return country ? `${guide.locale}_${country}` : OPEN_GRAPH_LOCALES[guide.locale];
}

/** The other countries whose readers a language's landing page is written for, as a shared link names them. */
export const OPEN_GRAPH_ALTERNATE_LOCALES: Partial<Record<LandingLocale, readonly string[]>> = {
  en: ['en_US'],
  es: ['es_MX'],
  fr: ['fr_CA'],
};

/** The picture of this language a shared link shows: scripts/generate-share-images.mjs draws it. */
export function shareImage(locale: LandingLocale): string {
  return `/share/${locale}.png`;
}
