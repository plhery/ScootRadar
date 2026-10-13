import { describe, expect, it } from 'vitest';
import { cityOfAddress, GEOCODE_LANGUAGES, namedCities, searchCoveredCities } from '@/app/api/geocode/cities';
import { COVERED_CITIES } from '@/lib/coveredCities';
import { searchRegionalScooterCities } from '@/lib/regionalScooterSystems';

const names = (query: string) => searchCoveredCities(query).map(city => city.display_name);

describe('searchCoveredCities', () => {
  it('finds a city with scooter data by its name, before a city in another country that only starts like it', () => {
    expect(searchCoveredCities('Biel')).toEqual([
      { lat: 47.1368, lng: 7.2468, display_name: 'Biel/Bienne, Switzerland', title: 'Biel/Bienne', subtitle: 'Switzerland', covered: true },
    ]);
    expect(searchCoveredCities('Roma')).toEqual([
      { lat: 41.9028, lng: 12.4964, display_name: 'Roma, Italy', title: 'Roma', subtitle: 'Italy', covered: true },
      { lat: 47.555, lng: 9.39, display_name: 'Romanshorn, Switzerland', title: 'Romanshorn', subtitle: 'Switzerland', covered: true },
    ]);
    expect(names('Bern')).toEqual(['Bern, Switzerland']);
    expect(names('Zürich')).toEqual(['Zürich, Switzerland']);
    expect(names('basel')).toEqual(['Basel, Switzerland']);
    expect(names('Winterthur')).toEqual(['Winterthur, Switzerland']);
  });

  it.each([
    ['Zurich', 'Zürich'], ['Zuerich', 'Zürich'], ['Zurigo', 'Zürich'], ['ZÜRICH', 'Zürich'],
    ['Bienne', 'Biel/Bienne'], ['Biel/Bienne', 'Biel/Bienne'], ['Biel Bienne', 'Biel/Bienne'],
    ['Berne', 'Bern'], ['Berna', 'Bern'], ['Bâle', 'Basel'], ['Basilea', 'Basel'],
    ['St. Gallen', 'St. Gallen'], ['St.Gallen', 'St. Gallen'], ['St Gallen', 'St. Gallen'],
    ['Sankt Gallen', 'St. Gallen'], ['Saint-Gall', 'St. Gallen'], ['San Gallo', 'St. Gallen'],
    ['Winterthour', 'Winterthur'], ['Zoug', 'Zug'], ['Schaffhouse', 'Schaffhausen'], ['Effretikon', 'Illnau-Effretikon'],
    ['Munich', 'München'], ['Muenchen', 'München'], ['Rome', 'Roma'], ['Cologne', 'Köln'], ['koln', 'Köln'],
  ])('finds "%s" as %s', (query, title) => {
    expect(searchCoveredCities(query)[0].title).toBe(title);
  });

  it('lists the cities a few letters could become, a city typed in full first and the others by name', () => {
    expect(names('Ber')).toEqual(['Berlin, Germany', 'Bern, Switzerland']);
    // Portimão by its beach, Praia da Rocha.
    expect(names('Ro')).toEqual(['Portimão, Portugal', 'Roma, Italy', 'Romanshorn, Switzerland', 'Rorschach, Switzerland']);
    expect(names('Rom')).toEqual(['Roma, Italy', 'Romanshorn, Switzerland']);
    expect(names('Roma')).toEqual(['Roma, Italy', 'Romanshorn, Switzerland']);
    // Vestmannaeyjar by its island, Heimaey.
    expect(names('He')).toEqual([
      'Heidelberg, Germany', 'Heilbronn, Germany', 'Hellissandur, Iceland', 'Hérouville-Saint-Clair, France', 'Vestmannaeyjar, Iceland',
    ]);
    expect(searchCoveredCities('B')).toEqual([]);
    expect(searchCoveredCities('a').length).toBe(0);
  });

  it('returns five cities at most', () => {
    // Two initials: every city with a word that starts with a B, eighteen of them.
    expect(names('B B')).toEqual([
      'Bærum, Norway', 'Bamberg, Germany', 'Basel, Switzerland', 'Bath, United Kingdom', 'Beauvais, France',
    ]);
  });

  it('takes a country typed beside the city, in any language of the app', () => {
    expect(names('Biel Schweiz')).toEqual(['Biel/Bienne, Switzerland']);
    expect(names('Biel Suisse')).toEqual(['Biel/Bienne, Switzerland']);
    expect(names('Ber Germany')).toEqual(['Berlin, Germany']);
    expect(names('Ber Svizzera')).toEqual(['Bern, Switzerland']);
    expect(names('Leipzig Deutschland')).toEqual(['Leipzig, Germany']);
    expect(names('Roma Svizzera')).toEqual(['Romanshorn, Switzerland']);
    expect(names('Lyon Italia')).toEqual([]);
    // A country alone names no city.
    expect(names('Schweiz')).toEqual([]);
  });

  it('writes the country in the language asked for, and English when none is', () => {
    const lines = (query: string, language?: 'en' | 'de' | 'fr' | 'it') =>
      searchCoveredCities(query, language).map(city => `${city.title} / ${city.subtitle}`);
    expect(lines('Ber')).toEqual(['Berlin / Germany', 'Bern / Switzerland']);
    expect(lines('Ber', 'en')).toEqual(['Berlin / Germany', 'Bern / Switzerland']);
    expect(lines('Ber', 'de')).toEqual(['Berlin / Deutschland', 'Bern / Schweiz']);
    expect(lines('Ber', 'fr')).toEqual(['Berlin / Allemagne', 'Bern / Suisse']);
    expect(lines('Ber', 'it')).toEqual(['Berlin / Germania', 'Bern / Svizzera']);
    expect(lines('Lyon', 'de')).toEqual(['Lyon / Frankreich']);
    expect(lines('Lyon', 'fr')).toEqual(['Lyon / France']);
    expect(lines('Lyon', 'it')).toEqual(['Lyon / Francia']);
    expect(lines('Rome', 'de')).toEqual(['Roma / Italien']);
    expect(lines('Rome', 'fr')).toEqual(['Roma / Italie']);
    expect(lines('Rome', 'it')).toEqual(['Roma / Italia']);
  });

  it('keeps display_name in English in every language, as older app versions decode it', () => {
    for (const language of GEOCODE_LANGUAGES) {
      expect(searchCoveredCities('Munich', language)[0].display_name, language).toBe('München, Germany');
      expect(searchCoveredCities('Zürich', language)[0].display_name, language).toBe('Zürich, Switzerland');
    }
  });

  it('names countries as the "Cities with scooters" chips of the web app do', () => {
    // src/lib/places.ts asks Intl.DisplayNames; a typed city and a chip must read the same.
    for (const language of GEOCODE_LANGUAGES) {
      const regions = new Intl.DisplayNames(`${language}-CH`, { type: 'region' });
      for (const [query, country] of [['Zürich', 'CH'], ['Lyon', 'FR'], ['Berlin', 'DE'], ['Roma', 'IT'], ['Uppsala', 'SE']]) {
        expect(searchCoveredCities(query, language)[0].subtitle, `${country} in ${language}`).toBe(regions.of(country));
      }
    }
  });

  it('leaves streets, stations and towns without scooter data to the address search', () => {
    for (const query of ['Bahnhofstrasse 1 Zürich', 'Zürich HB', 'Bern Bahnhof', 'Zürichstrasse', 'Rue de Berne', 'Lausanne', 'Genf', 'Genève', 'Milano', 'Luzern', '8001']) {
      expect(searchCoveredCities(query), query).toEqual([]);
    }
  });

  it('finds every city with scooter data by its own name, first', () => {
    for (const city of COVERED_CITIES) {
      const [first] = searchCoveredCities(city.city);
      expect(first, city.city).toMatchObject({
        title: city.city, lat: city.center[0], lng: city.center[1], covered: true,
      });
    }
  });

  it('finds the cities outside Switzerland as the regional catalogue search does', () => {
    for (const query of ['Munich', 'Rome', 'Lyon', 'Marseille', 'Paris', 'Köln', 'Koeln', 'Frankfurt', 'Saint-Q', 'La', 'He', 'Lyon France', 'Stuttgart Deutschland']) {
      expect(names(query), query).toEqual(searchRegionalScooterCities(query).map(city => city.display_name));
    }
    // Swiss cities take their place among them by name.
    expect(names('St')).toEqual(['St. Gallen, Switzerland', 'Stavanger, Norway', 'Stjørdal, Norway', 'Stuttgart, Germany', 'Stykkishólmur, Iceland']);
    expect(searchRegionalScooterCities('St').map(city => city.display_name))
      .toEqual(['Stavanger, Norway', 'Stjørdal, Norway', 'Stuttgart, Germany', 'Stykkishólmur, Iceland']);
  });
});

describe('namedCities', () => {
  it('says of each city whether it was typed in full, and in which country it is', () => {
    expect(namedCities('Ber').map(({ city, exact, country }) => [city.title, exact, country])).toEqual([
      ['Berlin', false, 'DE'], ['Bern', false, 'CH'],
    ]);
    expect(namedCities('Bienne').map(({ city, exact }) => [city.title, exact])).toEqual([['Biel/Bienne', true]]);
    // By its short name.
    expect(namedCities('Freiburg').map(({ city, exact, country }) => [city.title, exact, country])).toEqual([
      ['Freiburg im Breisgau', true, 'DE'],
    ]);
  });
});

describe('cityOfAddress', () => {
  it.each<[query: string, address: string, city: string]>([
    ['Bahnhofstrasse 10 Biel', 'Bahnhofstrasse 10', 'Biel/Bienne'],
    ['Bahnhofstrasse 10, Biel/Bienne', 'Bahnhofstrasse 10', 'Biel/Bienne'],
    ['Bahnhofstrasse 10, Bienne', 'Bahnhofstrasse 10', 'Biel/Bienne'],
    ['Kolosseum, Roma', 'Kolosseum', 'Roma'],
    ['Zürich, Langstrasse 120', 'Langstrasse 120', 'Zürich'],
    ['8004 Zürich', '8004', 'Zürich'],
    ['10 Rue de la République Lyon', '10 Rue de la République', 'Lyon'],
    ['Bahnhofstrasse 10 St. Gallen', 'Bahnhofstrasse 10', 'St. Gallen'],
    ['Karl Johans gate 10 Oslo', 'Karl Johans gate 10', 'Oslo'],
    // The longest name: not Hove, another name of Brighton's too.
    ['12 North Street, Brighton and Hove', '12 North Street', 'Brighton'],
  ])('finds "%s" as "%s" in %s', (query, address, city) => {
    const { center } = COVERED_CITIES.find(covered => covered.city === city)!;
    expect(cityOfAddress(query)).toEqual({ address, center });
  });

  it.each([
    // Streets named after a city, wherever they are.
    'Via Roma', 'Via Roma 10', 'Bristol Road', '10 Rue de Lyon', 'Rue de Lyon', 'Gare de Lyon',
    // Stations of a city, which the address search finds by its name.
    'Zürich HB', 'Basel SBB',
    // A city alone.
    'Lyon',
    // A name other towns have too: Fribourg is Freiburg in German, and two towns of our list are on Tenerife.
    'Bahnhofstrasse 10 Freiburg', 'Calle Mayor 5, Tenerife',
    // Nothing, or next to nothing, to look for.
    ', Biel', '1 Biel',
  ])('leaves "%s" to the search everywhere', query => {
    expect(cityOfAddress(query)).toBeNull();
  });
});
