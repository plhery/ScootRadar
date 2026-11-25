import { describe, expect, it } from 'vitest';
import { LANDING_LOCALES } from './landingCopy';
import { MIN_ANDROID } from './playTest';
import { PLAY_TEST_COPY } from './playTestCopy';

describe('the invitation to install the Android app, in every language of the site', () => {
  it('has every word in every language, none empty or left in English by mistake', () => {
    const english = new Map(Object.entries(PLAY_TEST_COPY.en));
    for (const locale of LANDING_LOCALES) {
      for (const [key, value] of Object.entries(PLAY_TEST_COPY[locale])) {
        expect(value.trim(), `${locale} ${key}`).not.toBe('');
        expect(value, `${locale} ${key}`).toBe(value.trim());
        // Names may be the same; sentences may not.
        if (locale !== 'en' && value.includes(' ')) expect(value, `${locale} ${key}`).not.toBe(english.get(key));
      }
    }
  });

  it('says nothing more of a test or of being early: the app is out', () => {
    for (const locale of LANDING_LOCALES) {
      const words = Object.values(PLAY_TEST_COPY[locale]).join(' ');
      expect(words, locale).not.toMatch(/\b(test|tester|beta|early)\b|vorab|teste|prova|probeer|prøv|experimente|prueba|prófa/i);
    }
  });

  it('writes German as the site does, without ß', () => {
    expect(Object.values(PLAY_TEST_COPY.de).join(' ')).not.toContain('ß');
  });

  it('names the version the app needs, as playTest.ts does', () => {
    for (const locale of LANDING_LOCALES) expect(PLAY_TEST_COPY[locale].pitch, locale).toContain(`Android ${MIN_ANDROID}`);
  });

  it('fits the map’s chip on a phone: its words stay short', () => {
    for (const locale of LANDING_LOCALES) expect(PLAY_TEST_COPY[locale].title.length, locale).toBeLessThanOrEqual(36);
  });
});
