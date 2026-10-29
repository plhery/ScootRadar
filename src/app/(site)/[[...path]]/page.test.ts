import type { Metadata } from 'next';
import { describe, expect, it, vi } from 'vitest';
import { GUIDES } from '@/guides';
import { guidePath } from '@/lib/guides';
import { LANDING_LOCALES } from '@/lib/landingCopy';
import { MAP_PATH } from '@/lib/mapAddress';
import { SITE_URL } from '@/lib/site';
import { sitePageOf, sitePagePath, sitePaths, type SitePage } from '@/lib/sitePages';
import { metadata as mapMetadata } from '../../(map)/layout';
import { metadata as privacyMetadata } from '../../(map)/privacy/page';
import sitemap from '../../sitemap';
import { metadata as siteMetadata } from './layout';
import { generateMetadata } from './page';

// The layouts load their typefaces from Google at build time; here they are only names.
vi.mock('next/font/google', () => {
  const font = () => ({ variable: 'font', className: 'font' });
  return { Geist: font, Red_Hat_Display: font, Red_Hat_Text: font };
});

/**
 * An address of the metadata, on the host the layout names. Only a path from the root or a whole address
 * is the same address wherever it is read: Next puts the page's own path on a URL object or a relative path.
 */
function address(value: unknown): string {
  if (typeof value !== 'string' || !/^(\/|https:\/\/)/.test(value)) throw new Error(`Not an address: ${JSON.stringify(value)}`);
  return new URL(value, siteMetadata.metadataBase!).href;
}

/** The page in each language it is written in, by language, with x-default for a reader of none of them. */
function languagesOf(alternates: Metadata['alternates']): Record<string, string> | undefined {
  const languages = alternates?.languages;
  if (!languages) return undefined;
  return Object.fromEntries(Object.entries(languages).map(([language, value]) => [language, address(value)]));
}

// What a search engine reads in the head of every page built: where the page is, and where it is in other languages.
const pages = await Promise.all(sitePaths().map(async path => {
  const page = sitePageOf(path)!;
  const { alternates } = await generateMetadata({ params: Promise.resolve({ path }) });
  return { page, canonical: address(alternates?.canonical), languages: languagesOf(alternates) };
}));
const byAddress = new Map(pages.map(entry => [entry.canonical, entry]));

const translated = pages.filter(entry => entry.languages);
const guideOn = (topic: string, locale: SitePage['locale']) =>
  pages.find(({ page }) => page.kind === 'guide' && page.guide.topic === topic && page.locale === locale)!;

describe('the links between a page and its translations', () => {
  it('name each page by its own address on the site, as do its links', () => {
    expect(String(siteMetadata.metadataBase)).toBe(`${SITE_URL}/`);
    for (const { page, canonical, languages } of pages) {
      expect(canonical).toBe(address(sitePagePath(page)));
      for (const link of Object.values(languages ?? {})) expect(new URL(link).origin, canonical).toBe(SITE_URL);
    }
  });

  it('lead only to pages that are built, in the language they are named by, the page itself among them', () => {
    expect(translated.length).toBeGreaterThan(40);
    for (const { page, canonical, languages } of translated) {
      const named = Object.keys(languages!).filter(language => language !== 'x-default');
      expect(named.length, canonical).toBeGreaterThan(1);
      expect(languages![page.locale], canonical).toBe(canonical);
      for (const [language, link] of Object.entries(languages!)) {
        const target = byAddress.get(link);
        expect(target, `${canonical} → ${link}`).toBeDefined();
        if (language !== 'x-default') expect(target!.page.locale, `${canonical} → ${link}`).toBe(language);
      }
      expect(LANDING_LOCALES).toEqual(expect.arrayContaining(named));
      // The English page when there is one, as the sitemap names it too.
      if (languages!.en) expect(languages!['x-default'], canonical).toBe(languages!.en);
      else expect(languages, canonical).not.toHaveProperty('x-default');
    }
  });

  it('are the same on every page they lead to, so each link leads back', () => {
    for (const { canonical, languages } of translated) {
      for (const link of Object.values(languages!)) expect(byAddress.get(link)!.languages, `${canonical} → ${link}`).toEqual(languages);
    }
  });

  it('pair a guide with the guides on its topic, whatever their addresses, and a guide in one language with none', () => {
    for (const { page, canonical, languages } of pages) {
      if (page.kind !== 'guide') continue;
      const same = GUIDES.filter(guide => guide.topic === page.guide.topic).map(guide => address(guidePath(guide)));
      if (same.length === 1) expect(languages, canonical).toBeUndefined();
      else expect(new Set(Object.values(languages!)), canonical).toEqual(new Set(same));
    }
    // The ones a search engine was seen mixing up: the addresses differ in each language.
    expect(guideOn('munich', 'en').languages?.de).toBe(guideOn('munich', 'de').canonical);
    expect(guideOn('oslo', 'nb').languages?.en).toBe(guideOn('oslo', 'en').canonical);
  });

  it('are none on the map and the privacy notice, which are in one language at one address', () => {
    for (const { alternates } of [mapMetadata, privacyMetadata]) expect(alternates?.languages).toBeUndefined();
  });

  it('are the ones the sitemap gives each page, and it lists every page built', () => {
    const single = [address(MAP_PATH), address('/privacy')];
    const entries = sitemap();
    expect(entries.map(entry => entry.url).filter(url => !single.includes(url)).sort()).toEqual([...byAddress.keys()].sort());
    for (const { url, alternates } of entries) expect(alternates?.languages, url).toEqual(byAddress.get(url)?.languages);
  });
});

// The language and country a link to each page names where it is shared.
const shared = await Promise.all(sitePaths().map(async path => {
  const page = sitePageOf(path)!;
  const { openGraph } = await generateMetadata({ params: Promise.resolve({ path }) });
  return { page, locale: (openGraph as { locale?: string } | undefined)?.locale };
}));
const sharedOn = (topic: string, locale: SitePage['locale']) =>
  shared.find(({ page }) => page.kind === 'guide' && page.guide.topic === topic && page.locale === locale)?.locale;

describe('the language and country a shared link to a guide names', () => {
  it('are the guide\'s language and the country of the city it is about', () => {
    for (const { page, locale } of shared) {
      if (page.kind !== 'guide') continue;
      expect(locale, page.guide.slug).toMatch(new RegExp(`^${page.guide.locale}_[A-Z]{2}$`));
      if (page.guide.city) expect(locale, page.guide.slug).toBe(`${page.guide.locale}_${page.guide.city.split(':')[0].toUpperCase()}`);
    }
    expect(sharedOn('chicago', 'en')).toBe('en_US');
    expect(sharedOn('bristol', 'en')).toBe('en_GB');
    expect(sharedOn('cologne', 'de')).toBe('de_DE');
    expect(sharedOn('oslo', 'nb')).toBe('nb_NO');
  });

  it('name the country of a guide with no city by its topic, and a guide about no country by its language', () => {
    expect(sharedOn('uk-law', 'en')).toBe('en_GB');
    expect(sharedOn('german-rules', 'de')).toBe('de_DE');
    expect(sharedOn('swiss-rules', 'fr')).toBe('fr_CH');
    expect(sharedOn('french-rules', 'fr')).toBe('fr_FR');
    expect(sharedOn('how-to-rent', 'en')).toBe('en_CH');
  });
});
