// Where the site lives and what it is called, for what is said about it to
// search engines and to the pages a link to it is shared on.

import type { LandingLocale } from '@/lib/landingCopy';

export const SITE_URL = 'https://scootradar.com';
export const SITE_NAME = 'ScootRadar';

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
