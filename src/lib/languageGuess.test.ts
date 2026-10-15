import { describe, expect, it } from 'vitest';
import { browserLanguages, guessLanguage, placeLanguages } from '@/lib/languageGuess';
import { LANDING_LOCALES } from '@/lib/landingCopy';

describe('the languages a browser asks for', () => {
  it('reads them most wanted first, without their region', () => {
    expect(browserLanguages('de-CH,de;q=0.9,en;q=0.8')).toEqual(['de', 'de', 'en']);
    expect(browserLanguages('en;q=0.5, fr-CH')).toEqual(['fr', 'en']);
  });

  it('leaves out what it does not want and what names no language', () => {
    expect(browserLanguages('it;q=0, *;q=0.5, pt;q=nonsense, es')).toEqual(['es']);
    expect(browserLanguages('')).toEqual([]);
    expect(browserLanguages(null)).toEqual([]);
  });

  it('takes every Norwegian for the site’s', () => {
    expect(browserLanguages('no, nn-NO;q=0.9, nb_NO;q=0.8')).toEqual(['nb', 'nb', 'nb']);
  });
});

describe('the languages spoken where the visitor is', () => {
  it.each([
    ['ZH', ['de']],
    ['VD', ['fr']],
    ['GE', ['fr']],
    ['TI', ['it']],
    ['VS', ['fr', 'de']],
    ['BE', ['de', 'fr']],
  ])('in the canton %s', (canton, languages) => {
    expect(placeLanguages('CH', canton)).toEqual(languages);
  });

  it('in Switzerland, when the canton is not known', () => {
    expect(placeLanguages('CH')).toEqual(['de', 'fr', 'it']);
  });

  it('by country, and by region where the country has two', () => {
    expect(placeLanguages('no')).toEqual(['nb']);
    expect(placeLanguages('BE', 'BRU')).toEqual(['fr', 'nl']);
    expect(placeLanguages('BE', 'VAN')).toEqual(['nl', 'fr']);
    expect(placeLanguages('CA', 'QC')).toEqual(['fr', 'en']);
  });

  it('is none where the site has no language, or the place is not known', () => {
    expect(placeLanguages('JP')).toEqual([]);
    expect(placeLanguages(null)).toEqual([]);
  });
});

describe('the language guessed beside the page’s', () => {
  const available = LANDING_LOCALES;

  it('is the first the browser asks for that is not the page’s', () => {
    expect(guessLanguage({ page: 'en', available, acceptLanguage: 'de-CH,de;q=0.9,en;q=0.8', country: 'CH', region: 'VD' }))
      .toEqual({ locale: 'de', reason: 'browser' });
    expect(guessLanguage({ page: 'de', available, acceptLanguage: 'de-CH,de;q=0.9,en;q=0.8', country: 'CH', region: 'ZH' }))
      .toEqual({ locale: 'en', reason: 'browser' });
    expect(guessLanguage({ page: 'fr', available, acceptLanguage: 'it-IT,it,en', country: 'FR' }))
      .toEqual({ locale: 'it', reason: 'browser' });
  });

  it('is spoken where the visitor is, when the browser asks for nothing else the site has', () => {
    expect(guessLanguage({ page: 'en', available, acceptLanguage: 'en-GB,en', country: 'CH', region: 'VD' }))
      .toEqual({ locale: 'fr', reason: 'place' });
    expect(guessLanguage({ page: 'en', available, acceptLanguage: 'ja-JP,ja', country: 'CH', region: 'ZH' }))
      .toEqual({ locale: 'de', reason: 'place' });
    expect(guessLanguage({ page: 'en', available, acceptLanguage: 'en-US', country: 'NO' }))
      .toEqual({ locale: 'nb', reason: 'place' });
  });

  it('is English when nothing else tells, unless the page is English', () => {
    expect(guessLanguage({ page: 'pt', available, acceptLanguage: 'pt-PT,pt', country: 'PT' }))
      .toEqual({ locale: 'en', reason: 'default' });
    expect(guessLanguage({ page: 'it', available })).toEqual({ locale: 'en', reason: 'default' });
    expect(guessLanguage({ page: 'en', available, acceptLanguage: 'ja-JP,ja', country: 'JP' })).toBeUndefined();
    expect(guessLanguage({ page: 'en', available })).toBeUndefined();
  });

  it('is one the page is written in', () => {
    const guide = ['en', 'de', 'it', 'nl'] as const;
    expect(guessLanguage({ page: 'en', available: guide, acceptLanguage: 'fr-CH,fr', country: 'CH', region: 'GR' }))
      .toEqual({ locale: 'de', reason: 'place' });
    expect(guessLanguage({ page: 'de', available: ['de', 'fr', 'it', 'nl'] as const, acceptLanguage: 'ja' })).toBeUndefined();
  });
});
