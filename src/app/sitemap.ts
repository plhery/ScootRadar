import type { MetadataRoute } from 'next';
import { DEFAULT_LANDING_LOCALE, LANDING_LOCALES, landingPath } from '@/lib/landingCopy';
import { LANDING_SNAPSHOT_DATE } from '@/lib/landingSnapshot';
import { MAP_PATH } from '@/lib/mapAddress';

const SITE = 'https://scooters.plhery.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // The landing page is one page per language, English at the root, and each names the others.
  const address = (locale: (typeof LANDING_LOCALES)[number]) => new URL(landingPath(locale), SITE).href;
  const languages = Object.fromEntries(LANDING_LOCALES.map(locale => [locale, address(locale)]));

  return [
    ...LANDING_LOCALES.map(locale => ({
      url: address(locale),
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
    {
      url: `${SITE}/privacy`,
      lastModified: new Date('2026-09-08'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
