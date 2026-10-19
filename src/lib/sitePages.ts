// The pages of src/app/(site)/[[...path]]: the landing page in each language,
// and the guides of each language with their list. English has no code in its
// addresses; the others start with theirs.

import {
  DEFAULT_LANDING_LOCALE,
  LANDING_LOCALES,
  isLandingLocale,
  landingLocaleOf,
  landingPath,
  type LandingLocale,
} from '@/lib/landingCopy';
import { GUIDES_SEGMENT, guideOf, guidePath, guidesIn, guidesPath, type Guide } from '@/lib/guides';

export type SitePage =
  | { kind: 'landing'; locale: LandingLocale }
  | { kind: 'guides'; locale: LandingLocale }
  | { kind: 'guide'; locale: LandingLocale; guide: Guide };

/** The page at a path of the site, from its segments, if there is one there. */
export function sitePageOf(segments: string[] | undefined): SitePage | null {
  const landing = landingLocaleOf(segments);
  if (landing) return { kind: 'landing', locale: landing };

  const [code, ...rest] = segments ?? [];
  const locale = isLandingLocale(code) && code !== DEFAULT_LANDING_LOCALE ? code : DEFAULT_LANDING_LOCALE;
  const [section, slug, ...more] = locale === DEFAULT_LANDING_LOCALE ? segments ?? [] : rest;
  if (section !== GUIDES_SEGMENT[locale] || more.length > 0) return null;

  if (slug === undefined) return guidesIn(locale).length > 0 ? { kind: 'guides', locale } : null;
  const guide = guideOf(locale, slug);
  return guide ? { kind: 'guide', locale, guide } : null;
}

/** The address of a page of the site. */
export function sitePagePath(page: SitePage): string {
  if (page.kind === 'landing') return landingPath(page.locale);
  if (page.kind === 'guides') return guidesPath(page.locale);
  return guidePath(page.guide);
}

/** Every page there is, as its segments: what is built. */
export function sitePaths(): string[][] {
  const segments = (path: string) => path.split('/').filter(Boolean);
  return LANDING_LOCALES.flatMap(locale => {
    const guides = guidesIn(locale);
    return [
      landingPath(locale),
      ...(guides.length > 0 ? [guidesPath(locale)] : []),
      ...guides.map(guidePath),
    ].map(segments);
  });
}
