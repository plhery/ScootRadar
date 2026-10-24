// Where the landing page is in each language: English at "/", the others under
// their code. The Worker, worker.ts, reads this to send a visitor on from "/",
// so it imports no more than languageGuess.ts, which imports nothing; the words
// of the page are in landingCopy.ts.

import { browserLanguages } from '@/lib/languageGuess';

export const LANDING_LOCALES = ['en', 'de', 'fr', 'it', 'nl', 'nb', 'pt', 'es', 'is'] as const;
export type LandingLocale = (typeof LANDING_LOCALES)[number];

export function isLandingLocale(value: string): value is LandingLocale {
  return (LANDING_LOCALES as readonly string[]).includes(value);
}

/** The language of the page at "/". The others are under their code. */
export const DEFAULT_LANDING_LOCALE: LandingLocale = 'en';

export function landingPath(locale: LandingLocale): string {
  return locale === DEFAULT_LANDING_LOCALE ? '/' : `/${locale}`;
}

/** The language a path of the site is in, from its segments, if it is the landing page. */
export function landingLocaleOf(segments: string[] | undefined): LandingLocale | null {
  if (!segments?.length) return DEFAULT_LANDING_LOCALE;

  const [code, ...rest] = segments;
  // English has one address, not two.
  return rest.length === 0 && isLandingLocale(code) && code !== DEFAULT_LANDING_LOCALE ? code : null;
}

/**
 * Whether a visit comes from outside the site: typed, from a bookmark or from a
 * link elsewhere. A browser too old to say is taken to come from the site.
 * A reload says nothing of where the page was first reached from but keeps
 * its referrer, which does.
 */
function fromOutside(request: Request): boolean {
  const site = request.headers.get('Sec-Fetch-Site');
  if (site !== 'none' && site !== 'cross-site') return false;

  const referrer = request.headers.get('Referer');
  if (!referrer) return true;
  try {
    return new URL(referrer).host !== new URL(request.url).host;
  } catch {
    return true;
  }
}

/**
 * The answer to a visit to "/" from a browser that asks for another of the
 * site's languages before English: that language's landing page, as the map
 * reads the first of its languages the browser asks for. A visit from a page
 * of the site stays, for the bar's English seat leads here. Where the visitor
 * is decides nothing: it only guesses the bar's second seat (worker.ts).
 * Search engines ask for no language and are given English, the default of
 * the pages' alternates. The query goes along for the counting of where the
 * visit came from, and the browser keeps the referrer and the fragment.
 */
export function landingLanguageRedirect(request: Request): Response | null {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;

  const url = new URL(request.url);
  if (url.pathname !== '/' || !fromOutside(request)) return null;

  const language = browserLanguages(request.headers.get('Accept-Language')).find(isLandingLocale);
  if (!language || language === DEFAULT_LANDING_LOCALE) return null;

  url.pathname = landingPath(language);
  return new Response(null, {
    status: 302,
    headers: {
      Location: url.href,
      'Cache-Control': 'no-store',
      Vary: 'Accept-Language, Sec-Fetch-Site, Referer',
    },
  });
}
