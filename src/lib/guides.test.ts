import { describe, expect, it } from 'vitest';
import { GUIDES } from '@/guides';
import { GUIDE_COPY } from '@/lib/guideCopy';
import {
  GUIDES_SEGMENT,
  guideCity,
  guideParts,
  guidePath,
  guideTexts,
  guidesIn,
  guidesPath,
  landingGuides,
  plainText,
  readingMinutes,
  sectionId,
  translationsOf,
  type Guide,
} from '@/lib/guides';
import { LANDING_LOCALES, landingPath } from '@/lib/landingCopy';
import { MAP_PATH } from '@/lib/mapAddress';
import { sitePageOf, sitePaths } from '@/lib/sitePages';

/** Every string of a value by its path, the functions called with something to say. */
function strings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (typeof value === 'function') return strings((value as (...values: unknown[]) => unknown)('A', 'B'), path);
  return Object.entries(value as object).flatMap(([key, child]) => strings(child, path ? `${path}.${key}` : key));
}

/** Everything a guide says, with where it says it. */
function said(guide: Guide): [string, string][] {
  return [
    ['name', guide.name],
    ['title', guide.title],
    ['description', guide.description],
    ...guideTexts(guide).map((text, index): [string, string] => [`text ${index}`, text]),
    ...guide.sources.map((source, index): [string, string] => [`source ${index}`, source.title]),
  ];
}

const segments = (path: string) => path.split('/').filter(Boolean);

// What the page of a guide already calls by these names.
const PAGE_ANCHORS = ['top', 'contents', 'find', 'faq', 'more', 'guides'];

describe('the guides', () => {
  it('has each at an address of its own, in words of its language joined by hyphens', () => {
    const addresses = GUIDES.map(guidePath);
    expect(new Set(addresses).size).toBe(GUIDES.length);
    for (const guide of GUIDES) expect(guide.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('writes a topic once in each language', () => {
    for (const guide of GUIDES) {
      expect(translationsOf(guide).filter(other => other.locale === guide.locale)).toEqual([guide]);
    }
  });

  it('has a title a search engine shows whole, and a description it does not cut', () => {
    for (const guide of GUIDES) {
      expect(guide.title.length, guide.title).toBeLessThanOrEqual(60);
      expect(guide.description.length, guide.description).toBeGreaterThanOrEqual(110);
      expect(guide.description.length, guide.description).toBeLessThanOrEqual(160);
      expect(guide.name.trim()).not.toBe('');
    }
  });

  it('is dated, updated on or after the day it was published', () => {
    for (const guide of GUIDES) {
      for (const day of [guide.published, guide.updated]) {
        expect(day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(new Date(day).toISOString().slice(0, 10)).toBe(day);
      }
      expect(guide.updated >= guide.published, guide.slug).toBe(true);
    }
  });

  it('leads only to places that are there', () => {
    const pages = new Set(sitePaths().map(path => `/${path.join('/')}`));
    for (const guide of GUIDES) {
      if (guide.city) expect(guideCity(guide.city), guide.city).toBeDefined();
      for (const text of guideTexts(guide)) {
        for (const part of guideParts(text, guide.locale)) {
          if (!part.href) continue;
          if (part.href.startsWith('https://')) continue;
          const [path] = part.href.split(/[?#]/);
          expect(path === MAP_PATH || pages.has(path), `${guide.slug}: ${part.href}`).toBe(true);
        }
      }
      for (const source of guide.sources) expect(source.url).toMatch(/^https:\/\//);
    }
  });

  it('closes every link and every strong word it opens', () => {
    for (const guide of GUIDES) {
      for (const text of guideTexts(guide)) {
        for (const part of guideParts(text, guide.locale)) {
          expect(part.text, `${guide.slug}: ${text}`).not.toMatch(/\*\*|\]\(|^\[|\[[^\]]*$/);
        }
      }
    }
  });

  it('gives each section an anchor of its own', () => {
    for (const guide of GUIDES) {
      const anchors = guide.sections.map(section => sectionId(section.heading));
      expect(new Set(anchors).size, guide.slug).toBe(anchors.length);
      for (const anchor of anchors) {
        expect(anchor, guide.slug).not.toBe('');
        expect(PAGE_ANCHORS, guide.slug).not.toContain(anchor);
      }
    }
  });

  it('has something in every section, every answer and every table row', () => {
    for (const guide of GUIDES) {
      expect(guide.sections.length).toBeGreaterThan(0);
      expect(guide.sources.length).toBeGreaterThan(0);
      for (const section of guide.sections) expect(section.blocks.length, section.heading).toBeGreaterThan(0);
      for (const { answer } of guide.faq) expect(answer.trim()).not.toBe('');
      for (const section of guide.sections) {
        for (const block of section.blocks) {
          if (typeof block === 'object' && 'table' in block) {
            for (const row of block.table.rows) expect(row.length, section.heading).toBe(block.table.head.length);
          }
        }
      }
    }
  });

  it('writes its apostrophes as apostrophes', () => {
    for (const guide of GUIDES) {
      for (const [where, text] of said(guide)) expect(plainText(text), `${guide.slug} ${where}`).not.toMatch(/'/);
    }
  });

  it('writes German the Swiss way', () => {
    for (const guide of guidesIn('de')) {
      for (const [where, text] of said(guide)) expect(plainText(text), `${guide.slug} ${where}`).not.toContain('ß');
    }
  });

  it('keeps French punctuation on the line of its word', () => {
    for (const guide of guidesIn('fr')) {
      for (const [where, text] of said(guide)) expect(plainText(text), `${guide.slug} ${where}`).not.toMatch(/ [:;?!%»]|« /);
    }
  });
});

describe('the words of a guide', () => {
  it('cuts them at their links and their strong words', () => {
    expect(guideParts('Ride on the **bike lane**, see [the law](https://www.fedlex.admin.ch/) and [Zürich](map:ch:zurich).', 'en'))
      .toEqual([
        { text: 'Ride on the ' },
        { text: 'bike lane', strong: true },
        { text: ', see ' },
        { text: 'the law', href: 'https://www.fedlex.admin.ch/' },
        { text: ' and ' },
        { text: 'Zürich', href: expect.stringMatching(/^\/map\?origin=47\.\d+,8\.\d+$/) },
        { text: '.' },
      ]);
    expect(plainText('Ride on the **bike lane**, see [the law](https://www.fedlex.admin.ch/).'))
      .toBe('Ride on the bike lane, see the law.');
  });

  it('leads a link to a topic to the guide on it in the same language', () => {
    for (const guide of GUIDES) {
      expect(guideParts(`[it](guide:${guide.topic})`, guide.locale)).toEqual([{ text: 'it', href: guidePath(guide) }]);
    }
  });

  it('will not lead anywhere that is not there', () => {
    expect(() => guideParts('[nowhere](map:ch:atlantis)', 'en')).toThrow(/atlantis/);
    expect(() => guideParts('[nothing](guide:nothing)', 'en')).toThrow(/nothing/);
  });

  it('anchors a section by its heading, in plain letters', () => {
    expect(sectionId('Wo darf ich fahren?')).toBe('wo-darf-ich-fahren');
    expect(sectionId('Où rouler ?')).toBe('ou-rouler');
    expect(sectionId('Hjelm, alder og promille')).toBe('hjelm-alder-og-promille');
    expect(sectionId('Bøter på fortauet')).toBe('boter-pa-fortauet');
  });

  it('takes a minute to read for every 220 words', () => {
    const guide = {
      headline: 'A',
      lede: Array(439).fill('word').join(' '),
      sections: [],
      faq: [],
    } as unknown as Guide;
    expect(readingMinutes(guide)).toBe(2);
  });
});

describe('the words around the guides', () => {
  it('says everything in each language', () => {
    const english = strings(GUIDE_COPY.en).map(([path]) => path);
    for (const locale of LANDING_LOCALES) {
      const translated = strings(GUIDE_COPY[locale]);
      expect(translated.map(([path]) => path)).toEqual(english);
      for (const [path, text] of translated) {
        expect(text.trim(), `${locale} ${path}`).not.toBe('');
        expect(text, `${locale} ${path}`).not.toMatch(/'/);
      }
    }
    for (const [path, text] of strings(GUIDE_COPY.de)) expect(text, path).not.toContain('ß');
    for (const [path, text] of strings(GUIDE_COPY.fr)) expect(text, path).not.toMatch(/ [:;?!%]/);
  });

  it('gives the list of each language a title a search engine shows whole', () => {
    for (const locale of LANDING_LOCALES) {
      const { index } = GUIDE_COPY[locale];
      expect(index.title.length, index.title).toBeLessThanOrEqual(60);
      expect(index.description.length, index.description).toBeGreaterThanOrEqual(110);
      expect(index.description.length, index.description).toBeLessThanOrEqual(160);
    }
  });
});

describe('the pages of the site', () => {
  it('has the landing page in each language', () => {
    for (const locale of LANDING_LOCALES) {
      expect(sitePageOf(segments(landingPath(locale)))).toEqual({ kind: 'landing', locale });
    }
  });

  it('finds each guide at its address, and the guides of a language at theirs', () => {
    for (const guide of GUIDES) {
      expect(sitePageOf(segments(guidePath(guide)))).toEqual({ kind: 'guide', locale: guide.locale, guide });
      expect(sitePageOf(segments(guidesPath(guide.locale)))).toEqual({ kind: 'guides', locale: guide.locale });
    }
  });

  it('calls the guides as each language does, English without its code', () => {
    expect(LANDING_LOCALES.map(guidesPath)).toEqual(
      ['/guides', '/de/ratgeber', '/fr/guides', '/it/guide', '/nl/gidsen', '/nb/guider', '/pt/guias', '/es/guias', '/is/leidarvisar'],
    );
    expect(Object.keys(GUIDES_SEGMENT)).toEqual([...LANDING_LOCALES]);
  });

  it('has nothing anywhere else', () => {
    for (const path of ['/en/guides', '/de/guides', '/guides/nowhere', '/de/ratgeber/nowhere', '/es/guides', '/guides/a/b', '/de/zurich']) {
      expect(sitePageOf(segments(path)), path).toBeNull();
    }
    for (const locale of LANDING_LOCALES.filter(language => guidesIn(language).length === 0)) {
      expect(sitePageOf(segments(guidesPath(locale))), locale).toBeNull();
    }
    for (const guide of GUIDES) {
      const elsewhere = LANDING_LOCALES.find(locale => locale !== guide.locale && guidesIn(locale).length > 0);
      if (elsewhere) expect(sitePageOf([...segments(guidesPath(elsewhere)), guide.slug])).toBeNull();
    }
  });

  it('builds every page there is, and each once', () => {
    const built = sitePaths();
    expect(new Set(built.map(path => path.join('/'))).size).toBe(built.length);
    for (const path of built) expect(sitePageOf(path), path.join('/')).not.toBeNull();
    expect(built.length).toBe(
      LANDING_LOCALES.length + GUIDES.length + LANDING_LOCALES.filter(locale => guidesIn(locale).length > 0).length,
    );
  });

  it('lists the guides of a language in its footer, the list of all of them last', () => {
    for (const locale of LANDING_LOCALES) {
      const listed = landingGuides(locale, GUIDE_COPY[locale].all);
      const guides = guidesIn(locale);
      if (guides.length === 0) {
        expect(listed).toEqual([]);
        continue;
      }
      expect(listed.map(guide => guide.href)).toEqual([...guides.map(guidePath), guidesPath(locale)]);
      expect(listed.at(-1)?.title).toBe(GUIDE_COPY[locale].all);
    }
  });
});
