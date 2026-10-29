import { describe, expect, it } from 'vitest';
import { REGIONAL_SCOOTER_CITIES, REGIONAL_SCOOTER_SYSTEMS, searchRegionalScooterCities, serviceAreas } from './regionalScooterSystems';
import { buildCityOverview, type FeedSnapshot } from './scooterSnapshots';
import { systemServesPoint } from './townOutlines';
import { formatRegion } from './formatLocale';
import { formatRidePrice } from './ridePrice';
import { namedCities } from '@/app/api/geocode/cities';

const system = (id: string) => REGIONAL_SCOOTER_SYSTEMS.find(entry => entry.id === id)!;

describe('Israel', () => {
  it('reads Bird and Lime around Tel Aviv, one area per town, all in Israel\'s time zone', () => {
    const israeli = REGIONAL_SCOOTER_SYSTEMS.filter(entry => entry.country === 'IL');
    const feeds = israeli.filter(entry => !entry.limeAppMap);
    // Not Bird's tel-aviv feed: the same scooters as its israel feed, under other ids.
    expect(feeds.map(entry => [entry.id, entry.discoveryUrl])).toEqual([
      ['bird_il_israel', 'https://mds.bird.co/gbfs/v2/public/israel/gbfs.json'],
      ['lime_il_tel_aviv', 'https://data.lime.bike/api/partners/v2/gbfs/tel_aviv/gbfs.json'],
    ]);
    expect(Object.fromEntries(feeds.map(entry => [entry.provider, serviceAreas(entry).map(area => area.city)]))).toEqual({
      bird: ['Tel Aviv', 'Ramat Gan', 'Holon', 'Bat Yam', 'Givatayim', 'Herzliya', 'Rishon LeZion', 'Ashdod', 'Bnei Brak', 'Ramat HaSharon'],
      lime: ['Tel Aviv', 'Ramat Gan', 'Petah Tikva', 'Holon', 'Givatayim', 'Herzliya', 'Kiryat Ono', 'Bnei Brak', 'Givat Shmuel', 'Or Yehuda'],
    });
    // Lime's tel_aviv feed has neither town: its rider map, read in small groups, since 26 October 2026.
    expect([...new Set(israeli.filter(entry => entry.limeAppMap).map(entry => entry.city))]).toEqual(['Ashdod', 'Eilat']);
    // Bird's feed says Asia/Tel_Aviv, an older name the app never reads.
    for (const entry of israeli) {
      for (const area of serviceAreas(entry)) expect(area.timeZone ?? entry.timeZone, `${entry.id} in ${area.city}`).toBe('Asia/Jerusalem');
    }
    expect(REGIONAL_SCOOTER_CITIES.filter(entry => entry.country === 'IL').map(entry => entry.id).sort()).toEqual([
      'il:Ashdod', 'il:Bat Yam', 'il:Bnei Brak', 'il:Eilat', 'il:Givat Shmuel', 'il:Givatayim', 'il:Herzliya', 'il:Holon', 'il:Kiryat Ono',
      'il:Or Yehuda', 'il:Petah Tikva', 'il:Ramat Gan', 'il:Ramat HaSharon', 'il:Rishon LeZion', 'il:Tel Aviv',
    ]);
  });

  it.each([
    ['Tel Aviv', 'Tel Aviv'], ['Tel Aviv-Yafo', 'Tel Aviv'], ['Jaffa', 'Tel Aviv'], ['Yafo', 'Tel Aviv'], ['TLV', 'Tel Aviv'],
    ['תל אביב', 'Tel Aviv'], ['תל־אביב–יפו', 'Tel Aviv'], ['תֵּל אָבִיב', 'Tel Aviv'], ['Tel Aviv, Israel', 'Tel Aviv'], ['תל אביב ישראל', 'Tel Aviv'],
    ['Rishon LeZion', 'Rishon LeZion'], ['Rishon Lezion', 'Rishon LeZion'], ['Rishon le-Zion', 'Rishon LeZion'], ['ראשון לציון', 'Rishon LeZion'],
    ['Petach Tikva', 'Petah Tikva'], ['פתח תקוה', 'Petah Tikva'], ['Herzlia', 'Herzliya'], ['Givataim', 'Givatayim'],
    ['Ramat Hasharon', 'Ramat HaSharon'], ['רמת השרון', 'Ramat HaSharon'], ['בני ברק', 'Bnei Brak'], ['קרית אונו', 'Kiryat Ono'],
    ['Eilat', 'Eilat'], ['אילת', 'Eilat'],
  ])('finds "%s" as %s', (query, title) => {
    expect(namedCities(query)[0]).toMatchObject({ city: { title, subtitle: 'Israel' } });
  });

  it('lists Tel Aviv under Jaffa without a request', () => {
    expect(searchRegionalScooterCities('Jaffa')[0].display_name).toBe('Tel Aviv, Israel');
  });

  it('writes shekels as Israel writes them', () => {
    // The app has no Hebrew: a browser in Israel gets English written as Israel writes it.
    expect(formatRegion('en', ['he-IL', 'he', 'en-US', 'en'])).toBe('IL');
    expect(formatRidePrice(125, 'ILS', 'en', 'IL')).toBe('₪1.25');
    expect(formatRidePrice(500, 'ILS', 'en', 'US')).toBe('₪5.00');
  });

  // Positions from the polls of 15 October 2026. Each stands inside the bounds of a neighbour,
  // nearer its centre, and most inside the bounds of several.
  const standing = {
    bird: [
      ['Tel Aviv', 32.12356, 34.84063], ['Tel Aviv', 32.0473, 34.75489], ['Ramat Gan', 32.08276, 34.808], ['Bnei Brak', 32.08588, 34.82589],
      ['Holon', 32.03249, 34.76066], ['Rishon LeZion', 31.99325, 34.74568], ['Herzliya', 32.15744, 34.81688], ['Givatayim', 32.06071, 34.81467],
      ['Ashdod', 31.80621, 34.66502],
    ],
    lime: [
      ['Ramat Gan', 32.08857, 34.80435], ['Tel Aviv', 32.04511, 34.75239], ['Ramat Gan', 32.04767, 34.83869], ['Petah Tikva', 32.08659, 34.8509],
      ['Ramat Gan', 32.0795, 34.8257], ['Kiryat Ono', 32.03985, 34.86017], ['Givatayim', 32.06159, 34.81821], ['Bnei Brak', 32.06963, 34.83926],
      ['Or Yehuda', 32.03968, 34.85885], ['Givat Shmuel', 32.08594, 34.85455],
    ],
  } as const;
  const ids = { bird: 'bird_il_israel', lime: 'lime_il_tel_aviv' } as const;

  it('counts each scooter of Gush Dan under the town it stands in, by the towns\' own boundaries', () => {
    const now = Date.now();
    const feeds = (Object.keys(standing) as (keyof typeof standing)[]).map((provider): FeedSnapshot => ({
      id: `israel:${ids[provider]}`, source: 'israel', provider, coverage: serviceAreas(system(ids[provider])).map(area => area.bounds),
      vehicles: standing[provider].map(([town, lat, lng], index) => ({ provider, vehicle_id: `${town}-${index}`, lat, lng, battery: 80,
        range_m: null, deep_link: null, distance_m: 0 })),
      observedAt: now, attemptedAt: now, collectedAt: now, stale: false, failed: false, skipped: false,
    }));
    for (const [provider, vehicles] of Object.entries(standing)) {
      for (const [town, lat, lng] of vehicles) expect(systemServesPoint(system(ids[provider as keyof typeof ids]), lat, lng), `${provider} in ${town}`).toBe(true);
    }
    const overview = buildCityOverview(feeds, now);
    const counted = Object.fromEntries(overview.cities.filter(city => city.id.startsWith('il:')).map(city => [city.city,
      Object.fromEntries(Object.entries(city.batteries).map(([provider, bins]) => [provider, bins.reduce((sum, count) => sum + count, 0)]))]));
    const expected: Record<string, Record<string, number>> = {};
    for (const [provider, vehicles] of Object.entries(standing)) {
      for (const [town] of vehicles) (expected[town] ??= {})[provider] = (expected[town][provider] ?? 0) + 1;
    }
    expect(counted).toEqual({ ...Object.fromEntries(REGIONAL_SCOOTER_CITIES.filter(city => city.country === 'IL').map(city => [city.city, {}])),
      ...expected });
  });

  it('keeps no scooter in a town its feed does not serve, nor beyond Gush Dan, Ashdod and Eilat', () => {
    for (const [provider, town, lat, lng] of [
      ['lime', 'Bat Yam', 32.01535, 34.76161], ['lime', 'Ramat HaSharon', 32.15479, 34.8135], ['bird', 'Petah Tikva', 32.09284, 34.8502],
      // One of Bird's 50 by Caesarea, left out.
      ['bird', 'Caesarea', 32.48542, 34.95371],
    ] as const) {
      expect(systemServesPoint(system(ids[provider]), lat, lng), `${provider} in ${town}`).toBe(false);
    }
    // No town reaches the West Bank: its nearest point to any of them, by Oranit, is about 5 km east of Petah Tikva's.
    // Eilat, on the Red Sea, is far south of it.
    for (const entry of REGIONAL_SCOOTER_SYSTEMS.filter(candidate => candidate.country === 'IL' && candidate.city !== 'Eilat')) {
      expect(entry.bounds.east).toBeLessThan(34.94);
    }
  });
});
