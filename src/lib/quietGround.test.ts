import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Feature } from 'protomaps-leaflet';
import { GROUND_PALETTES, forgetGroundTileUrl, groundRules, groundTileUrl, placeNameKeys } from '@/lib/quietGround';

const TILES = 'https://tiles.openfreemap.org/planet/20261007_001001_pt/{z}/{x}/{y}.pbf';
const answer = (body: unknown, ok = true) =>
  vi.fn(async () => ({ ok, status: ok ? 200 : 503, json: async () => body }) as Response);

beforeEach(() => {
  forgetGroundTileUrl();
});

describe('groundTileUrl', () => {
  it('asks once per visit where the tiles are', async () => {
    const fetcher = answer({ tiles: [TILES] });

    expect(await groundTileUrl(fetcher)).toBe(TILES);
    expect(await groundTileUrl(fetcher)).toBe(TILES);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith('https://tiles.openfreemap.org/planet');
  });

  it('does not remember a failure, so that the next try asks again', async () => {
    await expect(groundTileUrl(answer({}, false))).rejects.toThrow('Map tiles: 503');
    await expect(groundTileUrl(vi.fn(async () => { throw new TypeError('offline'); }))).rejects.toThrow('offline');

    expect(await groundTileUrl(answer({ tiles: [TILES] }))).toBe(TILES);
  });

  it.each([
    ['no address at all', {}],
    ['an address on another host', { tiles: ['https://example.com/{z}/{x}/{y}.pbf'] }],
    ['an address that is not a tile pattern', { tiles: ['https://tiles.openfreemap.org/planet'] }],
    ['an address with a query', { tiles: [`${TILES}?key=1`] }],
    ['something that is not text', { tiles: [42] }],
  ])('refuses %s', async (_name, body) => {
    await expect(groundTileUrl(answer(body))).rejects.toThrow('Map tiles: unexpected address');
  });
});

describe('groundRules', () => {
  it('draws the land in the colour of the page, by day and by night', () => {
    expect(GROUND_PALETTES.day.land).toBe('#eef0f4');
    expect(GROUND_PALETTES.night.land).toBe('#0b0e14');
  });

  it('writes more names on the detailed map than on the calm one', () => {
    const calm = groundRules('night', 'calm', 'Red Hat Text');
    const detailed = groundRules('night', 'detailed', 'Red Hat Text');
    expect(detailed.labels.length).toBeGreaterThan(calm.labels.length);
    // What is drawn under the names is the same.
    expect(detailed.paint.length).toBeGreaterThanOrEqual(calm.paint.length);
  });
});

describe('placeNameKeys', () => {
  // Names as OpenFreeMap's tiles carry them, read on 15 October 2026.
  const TEL_AVIV = { name: 'תל אביב–יפו', 'name:latin': 'Tel Aviv', 'name:en': 'Tel Aviv', 'name:he': 'תל אביב–יפו', 'name:el': 'Τελ Αβίβ' };
  const KUPAT_HOLIM = { name: 'כללית', 'name:he': 'כללית' };
  const DUBAI = { name: 'دبي', 'name:latin': 'Dubai', 'name:en': 'Dubai', 'name:he': 'דובאי', 'name:el': 'Ντουμπάι' };
  const MUSTAQBAL = { name: 'شارع المستقبل', 'name:latin': 'Al Mustaqbal Street', 'name:en': 'Al Mustaqbal Street' };
  const ATHENS = { name: 'Αθήνα', 'name:latin': 'Athens', 'name:en': 'Athens', 'name:el': 'Αθήνα', 'name:he': 'אתונה', 'name:de': 'Athen' };
  // Most streets of Athens give no name:el.
  const LENORMAN = { name: 'Λένορμαν', 'name:latin': 'Lenorman' };
  const KYIV = { name: 'Київ', 'name:latin': 'Kyiv', 'name:en': 'Kyiv', 'name:uk': 'Київ', 'name:el': 'Κίεβο', 'name:he': 'קייב', 'name:de': 'Kiew' };
  const ZURICH = { name: 'Zürich', 'name:latin': 'Zürich', 'name:en': 'Zurich', 'name:de': 'Zürich', 'name:el': 'Ζυρίχη', 'name:he': 'ציריך' };
  const LANGSTRASSE = { name: 'Langstrasse', 'name:latin': 'Langstrasse' };
  const OSLO = { name: 'Oslo', 'name:latin': 'Oslo', 'name:no': 'Oslo', 'name:fr': 'Oslo' };
  const BYGDOY = { name: 'Bygdøy allé', 'name:latin': 'Bygdøy allé' };
  const UNNAMED_SERVICE = { name: '1174', 'name:latin': '1174' };

  // As protomaps-leaflet reads them: the first key the feature has as text.
  const label = (language: string, props: Record<string, string>) => {
    const feature = { props } as unknown as Feature;
    const key = placeNameKeys(language)(16, feature).find(name => typeof props[name] === 'string');
    return key && props[key];
  };

  it('writes places in English, then in Latin letters, then as they are, for an English visitor', () => {
    expect([TEL_AVIV, KUPAT_HOLIM, DUBAI, MUSTAQBAL, ATHENS, LENORMAN, KYIV, ZURICH, LANGSTRASSE, UNNAMED_SERVICE].map(props => label('en', props)))
      .toEqual(['Tel Aviv', 'כללית', 'Dubai', 'Al Mustaqbal Street', 'Athens', 'Lenorman', 'Kyiv', 'Zurich', 'Langstrasse', '1174']);
  });

  it('writes them in Greek or Hebrew for a visitor whose browser is, and the local name in that script before its Latin form', () => {
    expect([ATHENS, LENORMAN, KYIV, ZURICH, TEL_AVIV, DUBAI, MUSTAQBAL].map(props => label('el', props)))
      .toEqual(['Αθήνα', 'Λένορμαν', 'Κίεβο', 'Ζυρίχη', 'Τελ Αβίβ', 'Ντουμπάι', 'Al Mustaqbal Street']);
    expect([TEL_AVIV, KUPAT_HOLIM, DUBAI, MUSTAQBAL, ATHENS, LENORMAN, ZURICH, LANGSTRASSE].map(props => label('he', props)))
      .toEqual(['תל אביב–יפו', 'כללית', 'דובאי', 'Al Mustaqbal Street', 'אתונה', 'Lenorman', 'ציריך', 'Langstrasse']);
  });

  it('keeps the names of the UI languages, Norwegian under no', () => {
    expect([ZURICH, ATHENS, LENORMAN, KYIV].map(props => label('de', props))).toEqual(['Zürich', 'Athen', 'Lenorman', 'Kiew']);
    expect([OSLO, BYGDOY, TEL_AVIV].map(props => label('nb', props))).toEqual(['Oslo', 'Bygdøy allé', 'Tel Aviv']);
    expect([KYIV, ATHENS].map(props => label('uk', props))).toEqual(['Київ', 'Athens']);
  });
});
