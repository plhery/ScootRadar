import { describe, expect, it } from 'vitest';
import { LANDING_LOCALES } from './landingCopy';
import { PLAY_TEST_COPY, type PlayTestCopy } from './playTestCopy';

/** Every string of a language's copy, by where it is. */
function strings(copy: PlayTestCopy): [string, string][] {
  const { steps, ...rest } = copy;
  return [
    ...Object.entries(rest),
    ...steps.flatMap((step, index) => Object.entries(step).map(([key, value]) => [`steps.${index}.${key}`, value] as [string, string])),
  ];
}

describe('the invitation to test the Android app, in every language of the site', () => {
  it('has every word in every language, none empty or left in English by mistake', () => {
    const english = new Map(strings(PLAY_TEST_COPY.en));
    for (const locale of LANDING_LOCALES) {
      const copy = PLAY_TEST_COPY[locale];
      expect(copy.steps).toHaveLength(3);
      for (const [key, value] of strings(copy)) {
        expect(value.trim(), `${locale} ${key}`).not.toBe('');
        expect(value, `${locale} ${key}`).toBe(value.trim());
        // Names and the badge may be the same; sentences may not.
        if (locale !== 'en' && value.includes(' ')) expect(value, `${locale} ${key}`).not.toBe(english.get(key));
      }
    }
  });

  it('keeps the words the user chose', () => {
    expect(PLAY_TEST_COPY.en.title).toBe('Try our Android app');
    expect(PLAY_TEST_COPY.de.title).toBe('Teste unsere Android-App');
    expect(PLAY_TEST_COPY.de.getEarly).toBe('Vorab testen');
  });

  it('writes German as the site does, without ß, and quotes Google’s buttons only in English', () => {
    expect(strings(PLAY_TEST_COPY.de).map(([, value]) => value).join(' ')).not.toContain('ß');
    for (const locale of LANDING_LOCALES.filter(locale => locale !== 'en')) {
      const hints = PLAY_TEST_COPY[locale].steps.map(step => step.hint).join(' ');
      expect(hints, locale).not.toMatch(/Join group|Become a tester/);
    }
  });

  it('names the version the app needs, as playTest.ts does', async () => {
    const { MIN_ANDROID } = await import('./playTest');
    for (const locale of LANDING_LOCALES) expect(PLAY_TEST_COPY[locale].note, locale).toContain(`Android ${MIN_ANDROID}`);
  });

  it('fits the map’s chip on a phone: its words stay short', () => {
    for (const locale of LANDING_LOCALES) {
      const { title, early } = PLAY_TEST_COPY[locale];
      expect(title.length + early.length, locale).toBeLessThanOrEqual(36);
      expect(early.length, locale).toBeLessThanOrEqual(6);
    }
  });
});
