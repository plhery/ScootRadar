import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { MAP_PATH } from '@/lib/mapAddress';
import { SITE_URL as SITE } from '@/lib/site';
import PrivacyPage from './(map)/privacy/page';
import sitemap from './sitemap';

// The map's layout loads its typefaces from Google at build time; here they are only names.
vi.mock('next/font/google', () => {
  const font = () => ({ variable: 'font', className: 'font' });
  return { Geist: font, Red_Hat_Display: font, Red_Hat_Text: font };
});

const entries = sitemap();
const at = (path: string) => entries.find(entry => entry.url === `${SITE}${path}`)!;

it('names, for every page in several languages, the one for a reader of none of them, as the page does', () => {
  const translated = entries.filter(entry => entry.alternates?.languages);
  expect(translated.length).toBeGreaterThan(10);
  for (const { url, alternates } of translated) {
    const languages = alternates!.languages as Record<string, string>;
    // The English page when there is one, which the pages' own links name too.
    if (languages.en) expect(languages['x-default'], url).toBe(languages.en);
    else expect(languages, url).not.toHaveProperty('x-default');
  }
  expect((at('/').alternates!.languages as Record<string, string>)['x-default']).toBe(`${SITE}/`);
});

it('dates the privacy notice by the day it says it was updated, and the live map not at all', () => {
  const shown = /Last updated: ([^<]+)</.exec(renderToStaticMarkup(PrivacyPage()))![1];
  expect(at('/privacy').lastModified).toEqual(new Date(`${shown} UTC`));
  expect(at(MAP_PATH)).not.toHaveProperty('lastModified');
});

it('describes the map in no more than the 160 characters a search engine shows', async () => {
  const { metadata } = await import('./(map)/layout');
  expect(String(metadata.description).length).toBeLessThanOrEqual(160);
  expect(metadata.openGraph?.description).toBe(metadata.description);
});
