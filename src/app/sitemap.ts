import type { MetadataRoute } from 'next';
import { LANDING_LOCALES } from '@/lib/landingCopy';
import { LANDING_SNAPSHOT_DATE } from '@/lib/landingSnapshot';

const SITE = 'https://scooters.plhery.com';

export default function sitemap(): MetadataRoute.Sitemap {
  // The landing page is one page per language, and each names the others.
  const languages = Object.fromEntries(LANDING_LOCALES.map(locale => [locale, `${SITE}/${locale}`]));

  return [
    {
      url: SITE,
      lastModified: new Date('2026-09-08'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...LANDING_LOCALES.map(locale => ({
      url: `${SITE}/${locale}`,
      lastModified: new Date(LANDING_SNAPSHOT_DATE),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
      alternates: { languages },
    })),
    {
      url: `${SITE}/privacy`,
      lastModified: new Date('2026-09-08'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
