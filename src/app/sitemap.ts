import type { MetadataRoute } from 'next';
import { GUIDES } from '@/guides';
import { guidePath, guidesIn, guidesPath, translationsOf } from '@/lib/guides';
import { DEFAULT_LANDING_LOCALE, LANDING_LOCALES, landingPath } from '@/lib/landingCopy';
import { LANDING_SNAPSHOT_DATE } from '@/lib/landingSnapshot';
import { MAP_PATH } from '@/lib/mapAddress';
import { SITE_URL as SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const address = (path: string) => new URL(path, SITE).href;
  // The landing page is one page per language, English at the root, and each names the others.
  const languages = Object.fromEntries(LANDING_LOCALES.map(locale => [locale, address(landingPath(locale))]));
  // The guides are listed in each language that has some; a guide names itself in the others it is written in.
  const listed = LANDING_LOCALES.filter(locale => guidesIn(locale).length > 0);
  const lists = Object.fromEntries(listed.map(locale => [locale, address(guidesPath(locale))]));
  const lastUpdate = (locale: (typeof LANDING_LOCALES)[number]) =>
    new Date(guidesIn(locale).map(guide => guide.updated).sort().at(-1)!);

  return [
    ...LANDING_LOCALES.map(locale => ({
      url: address(landingPath(locale)),
      lastModified: new Date(LANDING_SNAPSHOT_DATE),
      changeFrequency: 'monthly' as const,
      priority: locale === DEFAULT_LANDING_LOCALE ? 1 : 0.8,
      alternates: { languages },
    })),
    {
      url: `${SITE}${MAP_PATH}`,
      lastModified: new Date('2026-09-08'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...listed.map(locale => ({
      url: address(guidesPath(locale)),
      lastModified: lastUpdate(locale),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      alternates: { languages: lists },
    })),
    ...GUIDES.map(guide => {
      const translations = translationsOf(guide);
      return {
        url: address(guidePath(guide)),
        lastModified: new Date(guide.updated),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        ...(translations.length > 1 && {
          alternates: {
            languages: Object.fromEntries(translations.map(translation => [translation.locale, address(guidePath(translation))])),
          },
        }),
      };
    }),
    {
      url: `${SITE}/privacy`,
      lastModified: new Date('2026-09-08'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
