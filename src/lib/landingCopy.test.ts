import { describe, expect, it } from 'vitest';
import {
  LANDING_COPY, LANDING_LOCALES, LANGUAGE_NAMES, isLandingLocale, landingLocaleOf, landingPath, linkedParts, makerLinks,
} from '@/lib/landingCopy';
import { PROVIDERS } from '@/generated/providers';
import { LANDING_NEAREST } from '@/lib/landingSnapshot';
import { DEFAULT_RIDE_DURATION, RIDE_DURATIONS } from '@/lib/ridePrice';

/** Every string of a language by its path, the functions called with something to say. */
function strings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (typeof value === 'function') return strings((value as (...values: unknown[]) => unknown)('A', 'B', 'C', 'D'), path);
  return Object.entries(value as object).flatMap(([key, child]) => strings(child, path ? `${path}.${key}` : key));
}

describe('the languages of the landing page', () => {
  it('knows its nine languages and no other', () => {
    expect(LANDING_LOCALES).toEqual(['en', 'de', 'fr', 'it', 'nl', 'nb', 'pt', 'es', 'is']);
    expect(Object.keys(LANGUAGE_NAMES)).toEqual([...LANDING_LOCALES]);
    expect(isLandingLocale('fr')).toBe(true);
    expect(isLandingLocale('sv')).toBe(false);
    expect(isLandingLocale('')).toBe(false);
  });

  it('has English at the root and the others under their code', () => {
    expect(LANDING_LOCALES.map(landingPath)).toEqual(['/', '/de', '/fr', '/it', '/nl', '/nb', '/pt', '/es', '/is']);
    expect(landingLocaleOf(undefined)).toBe('en');
    expect(landingLocaleOf([])).toBe('en');
    for (const locale of ['de', 'fr', 'it', 'nl', 'nb', 'pt', 'es', 'is'] as const) expect(landingLocaleOf([locale])).toBe(locale);
  });

  it('has no second address for English, and none below a language', () => {
    expect(landingLocaleOf(['en'])).toBeNull();
    expect(landingLocaleOf(['sv'])).toBeNull();
    expect(landingLocaleOf(['de', 'zurich'])).toBeNull();
  });

  it('says everything in each of them', () => {
    const english = strings(LANDING_COPY.en).map(([path]) => path);
    for (const locale of LANDING_LOCALES) {
      const translated = strings(LANDING_COPY[locale]);
      expect(translated.map(([path]) => path)).toEqual(english);
      for (const [path, text] of translated) expect(text.trim(), `${locale} ${path}`).not.toBe('');
    }
  });

  it('writes its apostrophes as apostrophes', () => {
    for (const locale of LANDING_LOCALES) {
      for (const [path, text] of strings(LANDING_COPY[locale])) expect(text, `${locale} ${path}`).not.toMatch(/'/);
    }
  });

  it('writes German the Swiss way', () => {
    for (const [path, text] of strings(LANDING_COPY.de)) expect(text, path).not.toContain('ß');
  });

  it('keeps French punctuation on the line of its word', () => {
    for (const [path, text] of strings(LANDING_COPY.fr)) expect(text, path).not.toMatch(/ [:;?!%]/);
  });
});

describe('the links of the landing page', () => {
  /** The names a sentence gives its links, in order. */
  const linked = (sentence: string) => linkedParts(sentence).flatMap(({ link }) => link ?? []);
  /** What is read of a sentence, the words of its links included. */
  const read = (sentence: string) => linkedParts(sentence).map(({ text }) => text).join('');

  it('cuts a sentence at its links', () => {
    expect(linkedParts('By the <maker>maker</maker> of <peek>Peek, the tracker</peek>.')).toEqual([
      { text: 'By the ' },
      { text: 'maker', link: 'maker' },
      { text: ' of ' },
      { text: 'Peek, the tracker', link: 'peek' },
      { text: '.' },
    ]);
    expect(linkedParts('<source>Open source</source>')).toEqual([{ text: 'Open source', link: 'source' }]);
    expect(linkedParts('No link here.')).toEqual([{ text: 'No link here.' }]);
  });

  it('links the code where the page ends, and words the link under the first button apart', () => {
    for (const locale of LANDING_LOCALES) {
      const { closing, hero } = LANDING_COPY[locale];
      expect(linked(closing.note), locale).toEqual(['source']);
      // Nothing is left of a tag that was not closed, or misspelled.
      expect(read(closing.note), locale).not.toMatch(/[<>]/);
      // A share picture prints the first note as it is.
      expect(hero.note, locale).not.toMatch(/[<>]/);
    }
  });

  it('leads to the other sites of its maker in the language of the page', () => {
    expect(makerLinks('en')).toEqual({
      maker: 'https://x.com/plhery',
      horoscope: 'https://x-horoscope.com/en/x',
      monkey: 'https://unfollow-monkey.com/en',
      peek: 'https://peektracker.com',
    });
    expect(makerLinks('de')).toEqual({
      maker: 'https://x.com/plhery',
      horoscope: 'https://x-horoscope.com/de/x',
      monkey: 'https://unfollow-monkey.com/de',
      peek: 'https://peektracker.com/de',
    });
    // A site without the language leads to its English page.
    expect(makerLinks('nl')).toEqual({
      maker: 'https://x.com/plhery',
      horoscope: 'https://x-horoscope.com/en/x',
      monkey: 'https://unfollow-monkey.com/nl',
      peek: 'https://peektracker.com',
    });
    expect(makerLinks('nb')).toEqual({
      maker: 'https://x.com/plhery',
      horoscope: 'https://x-horoscope.com/en/x',
      monkey: 'https://unfollow-monkey.com/en',
      peek: 'https://peektracker.com',
    });
  });

  it('links each of them once in its last line', () => {
    for (const locale of LANDING_LOCALES) {
      const { maker } = LANDING_COPY[locale].footer;
      expect(linked(maker).sort(), locale).toEqual(Object.keys(makerLinks(locale)).sort());
      expect(read(maker), locale).not.toMatch(/[<>]/);
    }
  });
});

describe('what the landing page says of the snapshot', () => {
  it('names every provider it counts', () => {
    // "All seven" is spelled out in each language.
    expect(LANDING_NEAREST).toHaveLength(7);
    for (const locale of LANDING_LOCALES) {
      for (const { name } of LANDING_NEAREST) expect(LANDING_COPY[locale].know.all.text, locale).toContain(name);
    }
  });

  it('names every provider of the catalogue where it lists them', () => {
    // The description, and the first question with its answer: what a search brings up.
    for (const locale of LANDING_LOCALES) {
      const { meta, faq: { items: [first] } } = LANDING_COPY[locale];
      for (const { name } of Object.values(PROVIDERS)) {
        const short = name.split(' / ')[0];
        expect(meta.description(0), locale).toContain(short);
        expect(`${first.question} ${first.answer}`, locale).toContain(short);
      }
    }
  });

  it('quotes the rides the app estimates', () => {
    // "A ten-minute ride" is spelled out in each language, too.
    expect(DEFAULT_RIDE_DURATION).toBe(10);
    for (const locale of LANDING_LOCALES) {
      const { text } = LANDING_COPY[locale].know.price;
      expect(text, locale).toContain(String(RIDE_DURATIONS[0]));
      expect(text, locale).toContain(String(RIDE_DURATIONS.at(-1)));
    }
  });
});
