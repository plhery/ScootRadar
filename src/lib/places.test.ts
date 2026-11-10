import { describe, expect, it, vi } from 'vitest';
import { COVERED_CITIES } from '@/lib/coveredCities';
import {
  RECENT_PLACE_STORAGE_KEY,
  createRecentPlaceStore,
  placeForCity,
  searchNear,
  splitDisplayName,
  storedPlace,
  toPlace,
  type Place,
} from '@/lib/places';

function place(title: string, lat = 47.3695, lng = 8.5389): Place {
  return { lat, lng, display_name: title, title, subtitle: '8001 Zürich', covered: true };
}

describe('searchNear', () => {
  it('rounds the centre of a map of a city or less to about a kilometre', () => {
    expect(searchNear([48.856613, 2.352222], 10)).toEqual([48.86, 2.35]);
    expect(searchNear([47.37689, 8.541694], 17)).toEqual([47.38, 8.54]);
    expect(searchNear([-33.86882, 151.20929], 12)).toEqual([-33.87, 151.21]);
  });

  it('gives none for a map of a whole region, as on its first view, or before the map is there', () => {
    expect(searchNear([46.8182, 8.2275], 8)).toBeNull();
    expect(searchNear([48.856613, 2.352222], 9.5)).toBeNull();
    expect(searchNear(null, 15)).toBeNull();
  });
});

describe('splitDisplayName', () => {
  it('splits a legacy label at the first comma', () => {
    expect(splitDisplayName('München, Germany')).toEqual({ title: 'München', subtitle: 'Germany' });
    expect(splitDisplayName('Rue Faidherbe 12, 59000 Lille, France'))
      .toEqual({ title: 'Rue Faidherbe 12', subtitle: '59000 Lille, France' });
  });

  it('keeps a label without commas whole', () => {
    expect(splitDisplayName('Paradeplatz 2 8001 Zürich')).toEqual({ title: 'Paradeplatz 2 8001 Zürich', subtitle: '' });
  });

  it('tidies spaces and empty parts and never returns an empty title for a non-empty label', () => {
    expect(splitDisplayName('  Lausanne ,  , VD ')).toEqual({ title: 'Lausanne', subtitle: 'VD' });
    expect(splitDisplayName(' , ')).toEqual({ title: ',', subtitle: '' });
  });
});

describe('toPlace', () => {
  it('uses the two lines and the coverage the API sends', () => {
    expect(toPlace({
      lat: 46.7741, lng: 8.1558, display_name: 'Paradeplatz (OW) - Lungern',
      title: 'Paradeplatz', subtitle: 'Lungern OW', covered: false,
    })).toEqual({
      lat: 46.7741, lng: 8.1558, display_name: 'Paradeplatz (OW) - Lungern',
      title: 'Paradeplatz', subtitle: 'Lungern OW', covered: false,
    });
  });

  it('keeps an empty subtitle empty', () => {
    expect(toPlace({ lat: 47.37, lng: 8.54, display_name: 'Zürich HB', title: 'Zürich HB', subtitle: '', covered: true }).subtitle).toBe('');
  });

  it('falls back to the legacy label and works out the coverage for an older API', () => {
    expect(toPlace({ lat: 48.14, lng: 11.58, display_name: 'München, Germany' }))
      .toEqual({ lat: 48.14, lng: 11.58, display_name: 'München, Germany', title: 'München', subtitle: 'Germany', covered: true });
    expect(toPlace({ lat: 46.7741, lng: 8.1558, display_name: 'Paradeplatz (OW) - Lungern' }))
      .toMatchObject({ title: 'Paradeplatz (OW) - Lungern', subtitle: '', covered: false });
  });

  it('takes a row at the catalogue\'s centre of a covered city for the city as a whole', () => {
    const zurich = COVERED_CITIES.find(city => city.id === 'ch:zurich')!;
    const lyon = COVERED_CITIES.find(city => city.id === 'fr:Lyon')!;
    // What /api/geocode answers for "Zürich" and "Lyon": the catalogue's own rows.
    expect(toPlace({
      lat: zurich.center[0], lng: zurich.center[1], display_name: 'Zürich, Switzerland',
      title: 'Zürich', subtitle: 'Schweiz', covered: true,
    })).toEqual({
      lat: 47.3769, lng: 8.5417, display_name: 'Zürich, Switzerland', title: 'Zürich', subtitle: 'Schweiz', covered: true,
      city: true,
    });
    expect(toPlace({ lat: lyon.center[0], lng: lyon.center[1], display_name: 'Lyon, France', covered: true }).city).toBe(true);
    // An older server sends no coverage; the city is still recognised.
    expect(toPlace({ lat: lyon.center[0], lng: lyon.center[1], display_name: 'Lyon, France' }).city).toBe(true);
  });

  it('keeps an address, a station or a place a place, however close to the centre of a city', () => {
    const zurich = COVERED_CITIES.find(city => city.id === 'ch:zurich')!;
    const station = toPlace({ lat: 47.3782, lng: 8.5402, display_name: 'Zürich HB', title: 'Zürich HB', subtitle: 'Train', covered: true });
    expect(station).not.toHaveProperty('city');
    // Ten metres from the centre is another point.
    expect(toPlace({ lat: zurich.center[0] + 0.0001, lng: zurich.center[1], display_name: 'Bahnhofquai 3', covered: true }))
      .not.toHaveProperty('city');
    // A search service's own "Genf", without scooter data.
    expect(toPlace({ lat: 46.2046, lng: 6.1425, display_name: 'Genf (GE)', title: 'Genf', subtitle: 'GE', covered: false }))
      .not.toHaveProperty('city');
  });

  it('does not accept an empty title', () => {
    expect(toPlace({ lat: 47.37, lng: 8.54, display_name: 'Zürich, ZH', title: '  ', subtitle: 'ignored' }))
      .toMatchObject({ title: 'Zürich', subtitle: 'ZH' });
  });
});

describe('placeForCity', () => {
  const zurich = COVERED_CITIES.find(city => city.id === 'ch:zurich')!;
  const lyon = COVERED_CITIES.find(city => city.id === 'fr:Lyon')!;

  it('turns a city chip into a covered place at the city centre', () => {
    expect(placeForCity(zurich, 'en')).toEqual({
      lat: 47.3769, lng: 8.5417, display_name: 'Zürich, Switzerland', title: 'Zürich', subtitle: 'Switzerland', covered: true,
      city: true,
    });
  });

  it('names the country in the language of the app', () => {
    expect(placeForCity(zurich, 'de').subtitle).toBe('Schweiz');
    expect(placeForCity(lyon, 'de').subtitle).toBe('Frankreich');
    expect(placeForCity(lyon, 'it').subtitle).toBe('Francia');
    expect(placeForCity(zurich, 'fr').subtitle).toBe('Suisse');
  });
});

/** A Storage that keeps its items in a map, as a browser's localStorage does. */
function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() { return items.size; },
    clear: () => items.clear(),
    getItem: key => items.get(key) ?? null,
    key: index => [...items.keys()][index] ?? null,
    removeItem: key => { items.delete(key); },
    setItem: (key, value) => { items.set(key, String(value)); },
  };
}

describe('storedPlace', () => {
  it('reads back a place as it was stored', () => {
    const city: Place = { ...place('Zürich'), subtitle: 'Switzerland', city: true };
    expect(storedPlace(JSON.parse(JSON.stringify(city)))).toEqual(city);
    expect(storedPlace(JSON.parse(JSON.stringify(place('Paradeplatz 2'))))).toEqual(place('Paradeplatz 2'));
  });

  it('refuses what is not a place', () => {
    for (const value of [
      null, 'Zürich', 3, [], {},
      { lat: 47.37, lng: 8.54 },
      { lat: 47.37, lng: 8.54, title: '  ' },
      { lat: '47.37', lng: 8.54, title: 'Zürich' },
      { lat: 91, lng: 8.54, title: 'Zürich' },
      { lat: 47.37, lng: Number.NaN, title: 'Zürich' },
    ]) expect(storedPlace(value)).toBeNull();
  });

  it('says whether the map has data at the place as it has today, not as when it was stored', () => {
    // Manama, stored as "No data" before Hopp's feed there was added on 4 November 2026; Lungern, where there is none.
    const manama = { lat: 26.2235, lng: 50.5876, display_name: 'Manama, Bahrain', title: 'Manama', subtitle: 'Bahrain' };
    expect(storedPlace({ ...manama, covered: false })?.covered).toBe(true);
    expect(storedPlace({ lat: 46.7741, lng: 8.1558, title: 'Lungern', covered: true })?.covered).toBe(false);
  });

  it('fills in what an incomplete place leaves out', () => {
    expect(storedPlace({ lat: 46.7741, lng: 8.1558, title: 'Lungern', city: 'yes' })).toEqual({
      lat: 46.7741, lng: 8.1558, display_name: 'Lungern', title: 'Lungern', subtitle: '', covered: false,
    });
  });
});

describe('recent place store', () => {
  it('remembers the last place chosen, one at a time, and tells its subscribers', () => {
    const store = createRecentPlaceStore(memoryStorage);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    expect(store.get()).toBeNull();

    store.set(place('Paradeplatz 2'));
    store.set(place('Zürich HB'));
    expect(store.get()?.title).toBe('Zürich HB');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.set(place('Bellevue'));
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('returns the same place until it changes, as React requires of a store snapshot', () => {
    const store = createRecentPlaceStore(memoryStorage);
    store.set(place('A'));
    expect(store.get()).toBe(store.get());
  });

  it('keeps the place for the next visit, under its own key and nothing else', () => {
    const storage = memoryStorage();
    createRecentPlaceStore(() => storage).set(place('Paradeplatz 2'));
    expect(storage.length).toBe(1);
    expect(JSON.parse(storage.getItem(RECENT_PLACE_STORAGE_KEY)!)).toEqual(place('Paradeplatz 2'));

    // The page opened again.
    expect(createRecentPlaceStore(() => storage).get()).toEqual(place('Paradeplatz 2'));
  });

  it('forgets the place, in storage too', () => {
    const storage = memoryStorage();
    createRecentPlaceStore(() => storage).set(place('Paradeplatz 2'));
    const store = createRecentPlaceStore(() => storage);
    const listener = vi.fn();
    store.subscribe(listener);

    store.forget();
    expect(store.get()).toBeNull();
    expect(storage.getItem(RECENT_PLACE_STORAGE_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);
    // Nothing left to forget.
    store.forget();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('drops what it cannot read', () => {
    for (const saved of ['{', '"Zürich"', '{"lat":47.37}']) {
      const storage = memoryStorage();
      storage.setItem(RECENT_PLACE_STORAGE_KEY, saved);
      expect(createRecentPlaceStore(() => storage).get()).toBeNull();
      expect(storage.getItem(RECENT_PLACE_STORAGE_KEY)).toBeNull();
    }
  });

  it('remembers the place for the open page where storage is blocked or full', () => {
    const blocked = createRecentPlaceStore(() => { throw new DOMException('denied', 'SecurityError'); });
    blocked.set(place('Paradeplatz 2'));
    expect(blocked.get()?.title).toBe('Paradeplatz 2');

    const full = memoryStorage();
    full.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
    const store = createRecentPlaceStore(() => full);
    store.set(place('Zürich HB'));
    expect(store.get()?.title).toBe('Zürich HB');
  });
});
