import { describe, expect, it } from 'vitest';
import {
  LANDING_COPY, LANDING_LOCALES, LANGUAGE_NAMES, isLandingLocale, landingLocaleOf, landingPath, linkedParts, makerLinks,
} from '@/lib/landingCopy';
import { PROVIDERS } from '@/generated/providers';
import { COVERED_CITY_TOTAL, COVERED_COUNTRY_TOTAL, COVERED_PROVIDER_TOTAL } from '@/lib/coveredCities';
import { LANDING_NEAREST } from '@/lib/landingSnapshot';
import { DEFAULT_RIDE_DURATION, RIDE_DURATIONS } from '@/lib/ridePrice';
import { formatLocale } from '@/lib/formatLocale';

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

describe('the cities of the landing page', () => {
  /** The first sentence of the lede, which counts the providers and the countries. */
  const opening = (locale: (typeof LANDING_LOCALES)[number], providers: number, countries: number) =>
    LANDING_COPY[locale].cities.lede(providers, countries).split('. ')[0];
  /** A sentence as written here, each count held to its noun by a no-break space. */
  const held = (sentence: string) => sentence.replace(/(\d) /g, '$1\u00a0');

  it('counts the cities in its title, the noun in the form its count takes', () => {
    expect(LANDING_LOCALES.map(locale => LANDING_COPY[locale].cities.title(186))).toEqual([
      '186 cities.', '186 Städte.', '186 villes.', '186 città.', '186 steden.', '186 byer.', '186 cidades.', '186 ciudades.', '186 staðir.',
    ].map(held));
    expect(LANDING_LOCALES.map(locale => LANDING_COPY[locale].cities.title(1))).toEqual([
      '1 city.', '1 Stadt.', '1 ville.', '1 città.', '1 stad.', '1 by.', '1 cidade.', '1 ciudad.', '1 staður.',
    ].map(held));
    // Icelandic takes the singular for a count ending in 1, but not 11.
    expect([21, 22, 11].map(count => LANDING_COPY.is.cities.title(count))).toEqual(['21 staður.', '22 staðir.', '11 staðir.'].map(held));
  });

  it('counts the providers and the countries rather than naming them, each noun in the form its count takes', () => {
    expect(LANDING_LOCALES.map(locale => opening(locale, 23, 17))).toEqual([
      'Shared e-scooters from 23 providers in 17 countries',
      'E-Scooter von 23 Anbietern in 17 Ländern',
      'Des trottinettes en libre-service de 23 opérateurs dans 17 pays',
      'Monopattini in sharing di 23 operatori in 17 paesi',
      'Deelsteps van 23 aanbieders in 17 landen',
      'Elsparkesykler til leie fra 23 operatører i 17 land',
      'Trotinetes elétricas partilhadas de 23 operadores em 17 países',
      'Patinetes eléctricos compartidos de 23 operadores en 17 países',
      'Rafskútur til leigu frá 23 fyrirtækjum í 17 löndum',
    ].map(held));
    expect(LANDING_LOCALES.map(locale => opening(locale, 1, 1))).toEqual([
      'Shared e-scooters from 1 provider in 1 country',
      'E-Scooter von 1 Anbieter in 1 Land',
      'Des trottinettes en libre-service de 1 opérateur dans 1 pays',
      'Monopattini in sharing di 1 operatore in 1 paese',
      'Deelsteps van 1 aanbieder in 1 land',
      'Elsparkesykler til leie fra 1 operatør i 1 land',
      'Trotinetes elétricas partilhadas de 1 operador em 1 país',
      'Patinetes eléctricos compartidos de 1 operador en 1 país',
      'Rafskútur til leigu frá 1 fyrirtæki í 1 landi',
    ].map(held));
    // Icelandic takes the singular for a count ending in 1, but not 11.
    expect([21, 22, 11, 31].map(count => opening('is', count, count))).toEqual([
      'Rafskútur til leigu frá 21 fyrirtæki í 21 landi',
      'Rafskútur til leigu frá 22 fyrirtækjum í 22 löndum',
      'Rafskútur til leigu frá 11 fyrirtækjum í 11 löndum',
      'Rafskútur til leigu frá 31 fyrirtæki í 31 landi',
    ].map(held));
    expect(opening('en', 21, 21)).toBe(held('Shared e-scooters from 21 providers in 21 countries'));
  });

  it('keeps each count on the line of its noun, in every language', () => {
    for (const locale of LANDING_LOCALES) {
      const { title } = LANDING_COPY[locale].cities;
      for (const [text, counts] of [
        [title(COVERED_CITY_TOTAL), 1],
        [title(1200), 1],
        [opening(locale, COVERED_PROVIDER_TOTAL, COVERED_COUNTRY_TOTAL), 2],
        [opening(locale, 1, 1), 2],
      ] as const) {
        expect(text, locale).not.toMatch(/\d /);
        expect(text.match(/\d\u00a0\p{L}/gu), `${locale}: ${text}`).toHaveLength(counts);
      }
    }
  });

  it('keeps what the lede says after the count', () => {
    expect(LANDING_COPY.en.cities.lede(23, 17)).toBe(held(
      'Shared e-scooters from 23 providers in 17 countries. Where no provider publishes its data, the map says so and points you to the closest cities that have it. Pick a city to open the map there.'
    ));
    for (const locale of LANDING_LOCALES) expect(LANDING_COPY[locale].cities.lede(23, 17).split('. ')).toHaveLength(3);
  });
});

describe('the description of the landing page', () => {
  /** A sentence as written here, each count held to its noun by a no-break space. */
  const held = (sentence: string) => sentence.replace(/(\d) /g, '$1\u00a0');

  it('opens with the providers, the cities and the countries, each noun in the form its count takes', () => {
    expect(LANDING_LOCALES.map(locale => LANDING_COPY[locale].meta.description(35, 837, 46).split(/[.:] /)[1])).toEqual([
      '35 providers in 837 cities and 46 countries',
      '35 Anbieter in 837 Städten und 46 Ländern',
      '35 opérateurs dans 837 villes et 46 pays',
      '35 operatori in 837 città e 46 paesi',
      '35 aanbieders in 837 steden en 46 landen',
      '35 operatører i 837 byer og 46 land',
      '35 operadores em 837 cidades e 46 países',
      '35 operadores en 837 ciudades y 46 países',
      '35 fyrirtæki á 837 stöðum í 46 löndum',
    ].map(held));
    expect(LANDING_LOCALES.map(locale => LANDING_COPY[locale].meta.description(1, 1, 1).split(/[.:] /)[1])).toEqual([
      '1 provider in 1 city and 1 country',
      '1 Anbieter in 1 Stadt und 1 Land',
      '1 opérateur dans 1 ville et 1 pays',
      '1 operatore in 1 città e 1 paese',
      '1 aanbieder in 1 stad en 1 land',
      '1 operatør i 1 by og 1 land',
      '1 operador em 1 cidade e 1 país',
      '1 operador en 1 ciudad y 1 país',
      '1 fyrirtæki á 1 stað í 1 landi',
    ].map(held));
    expect(LANDING_COPY.en.meta.description(35, 837, 46)).toMatch(/^Every shared e-scooter near you on one live map: 35\u00a0providers in 837\u00a0cities and 46\u00a0countries\. Free, no account\. Lime, Bolt, /);
  });

  it('gives the counts before a search engine cuts it', () => {
    // Google shows about the first 155 characters of a description.
    for (const locale of LANDING_LOCALES) {
      const shown = LANDING_COPY[locale].meta.description(COVERED_PROVIDER_TOTAL, COVERED_CITY_TOTAL, COVERED_COUNTRY_TOTAL).slice(0, 155);
      for (const count of [COVERED_PROVIDER_TOTAL, COVERED_CITY_TOTAL, COVERED_COUNTRY_TOTAL]) {
        expect(shown, locale).toContain(`${new Intl.NumberFormat(formatLocale(locale)).format(count)}\u00a0`);
      }
    }
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
    for (const locale of ['de', 'fr', 'it', 'pt', 'es'] as const) {
      expect(makerLinks(locale), locale).toEqual({
        maker: 'https://x.com/plhery',
        horoscope: `https://x-horoscope.com/${locale}/x`,
        monkey: `https://unfollow-monkey.com/${locale}`,
        peek: `https://peektracker.com/${locale}`,
      });
    }
    // A site without the language leads to its English page.
    expect(makerLinks('nl')).toEqual({
      maker: 'https://x.com/plhery',
      horoscope: 'https://x-horoscope.com/en/x',
      monkey: 'https://unfollow-monkey.com/nl',
      peek: 'https://peektracker.com',
    });
    for (const locale of ['nb', 'is'] as const) {
      expect(makerLinks(locale), locale).toEqual({
        maker: 'https://x.com/plhery',
        horoscope: 'https://x-horoscope.com/en/x',
        monkey: 'https://unfollow-monkey.com/en',
        peek: 'https://peektracker.com',
      });
    }
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
    // The first card names the seven by Zürich main station, in each language.
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
        expect(meta.description(0, 0, 0), locale).toContain(short);
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
