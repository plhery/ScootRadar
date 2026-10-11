import { describe, expect, it } from 'vitest';
import {
  LANDING_COPY, LANDING_LOCALES, LANGUAGE_NAMES, isLandingLocale, landingLocaleOf, landingPath,
} from '@/lib/landingCopy';
import { LANDING_NEAREST } from '@/lib/landingSnapshot';
import { DEFAULT_RIDE_DURATION, RIDE_DURATIONS } from '@/lib/ridePrice';

/** Every string of a language by its path, the functions called with something to say. */
function strings(value: unknown, path = ''): [string, string][] {
  if (typeof value === 'string') return [[path, value]];
  if (typeof value === 'function') return strings((value as (...values: unknown[]) => unknown)('A', 'B', 'C', 'D'), path);
  return Object.entries(value as object).flatMap(([key, child]) => strings(child, path ? `${path}.${key}` : key));
}

describe('the languages of the landing page', () => {
  it('knows its four languages and no other', () => {
    expect(LANDING_LOCALES).toEqual(['en', 'de', 'fr', 'it']);
    expect(Object.keys(LANGUAGE_NAMES)).toEqual([...LANDING_LOCALES]);
    expect(isLandingLocale('fr')).toBe(true);
    expect(isLandingLocale('es')).toBe(false);
    expect(isLandingLocale('')).toBe(false);
  });

  it('has English at the root and the others under their code', () => {
    expect(LANDING_LOCALES.map(landingPath)).toEqual(['/', '/de', '/fr', '/it']);
    expect(landingLocaleOf(undefined)).toBe('en');
    expect(landingLocaleOf([])).toBe('en');
    for (const locale of ['de', 'fr', 'it'] as const) expect(landingLocaleOf([locale])).toBe(locale);
  });

  it('has no second address for English, and none below a language', () => {
    expect(landingLocaleOf(['en'])).toBeNull();
    expect(landingLocaleOf(['es'])).toBeNull();
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

describe('what the landing page says of the snapshot', () => {
  it('names every provider it counts', () => {
    // "All seven" is spelled out in each language.
    expect(LANDING_NEAREST).toHaveLength(7);
    for (const locale of LANDING_LOCALES) {
      for (const { name } of LANDING_NEAREST) expect(LANDING_COPY[locale].know.all.text, locale).toContain(name);
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
