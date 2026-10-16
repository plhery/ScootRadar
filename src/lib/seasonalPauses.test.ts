import { describe, expect, it, vi } from 'vitest';

// A Canada whose scooters stop for the winter, as data/countries.json and a catalog would list
// it: Bird in Montréal from 16 November until 15 April, Lime from 1 December until 1 April in
// Montréal but all year in Laval, on one feed. The generated modules are what
// scripts/generate-provider-catalog.mjs would write for them.
const fixture = vi.hoisted(() => {
  const montreal = { city: 'Montréal', center: [45.5, -73.57] as [number, number],
    bounds: { south: 45.41, west: -73.98, north: 45.7, east: -73.47 } };
  const laval = { city: 'Laval', center: [45.58, -73.75] as [number, number],
    bounds: { south: 45.52, west: -73.89, north: 45.7, east: -73.52 } };
  return {
    laval,
    systems: [
      { id: 'bird_montreal', provider: 'bird', country: 'CA' as const, ...montreal,
        seasonal: { from: '11-16', until: '04-15', timeZone: 'America/Toronto' },
        discoveryUrl: 'https://mds.bird.co/gbfs/v2/public/montreal/gbfs.json' },
      { id: 'lime_quebec', provider: 'lime', country: 'CA' as const, ...montreal,
        areas: [{ ...montreal, seasonal: { from: '12-01', until: '04-01', timeZone: 'America/Toronto' } }, laval],
        discoveryUrl: 'https://data.lime.bike/api/partners/v2/gbfs/montreal/gbfs.json' },
    ],
  };
});

vi.mock('@/generated/countryCatalogs', async importOriginal => {
  const original = await importOriginal<typeof import('@/generated/countryCatalogs')>();
  return { CATALOG_SYSTEMS: [...original.CATALOG_SYSTEMS, ...fixture.systems] };
});
vi.mock('@/generated/countries', async importOriginal => {
  const original = await importOriginal<typeof import('@/generated/countries')>();
  return {
    ...original,
    COUNTRY_CODES: [...original.COUNTRY_CODES, 'CA'],
    COUNTRY_SOURCES: { ...original.COUNTRY_SOURCES, CA: 'canada' },
    COUNTRY_CONTINENTS: { ...original.COUNTRY_CONTINENTS, CA: 'north-america' },
    COUNTRY_NAMES: { ...original.COUNTRY_NAMES, CA: { en: 'Canada', de: 'Kanada', fr: 'Canada', it: 'Canada',
      nl: 'Canada', nb: 'Canada', pt: 'Canadá', es: 'Canadá', is: 'Kanada' } },
    COUNTRY_SEARCH_WORDS: { ...original.COUNTRY_SEARCH_WORDS, CA: [] },
    COUNTRY_ANCHORS: { ...original.COUNTRY_ANCHORS, CA: [56, -96] },
  };
});

const { REGIONAL_SCOOTER_CITIES } = await import('@/lib/regionalScooterSystems');
const { activeSeasonalPause, feedCurfewed, feedPaused, pauseHolds, pausesReturn } = await import('@/lib/seasonalPauses');
const { querySnapshot } = await import('@/lib/scooterSnapshots');
const { dockModel } = await import('@/lib/dockModel');
const { translate } = await import('@/lib/i18n');
const { formatUiText } = await import('@/lib/uiText');
type FeedSnapshot = import('@/lib/scooterSnapshots').FeedSnapshot;
type DockInput = import('@/lib/dockModel').DockInput;
type AppLocale = import('@/lib/i18n').AppLocale;

const MONTREAL: [number, number] = [45.5, -73.57];
const LAVAL: [number, number] = [45.6, -73.75];
const JANUARY = Date.parse('2027-01-20T17:00:00Z');
const NOVEMBER = Date.parse('2026-11-20T17:00:00Z');
const JULY = Date.parse('2026-07-20T16:00:00Z');
const winter = { from: '11-16', until: '04-15', timeZone: 'America/Toronto' };

describe('a seasonal pause', () => {
  it('holds from its first day until the day the scooters are back, in its time zone, across the new year', () => {
    // Midnight in Montréal is 05:00 UTC in November, 04:00 in April.
    expect(pauseHolds(winter, Date.parse('2026-11-16T04:59:00Z'))).toBe(false);
    expect(pauseHolds(winter, Date.parse('2026-11-16T05:00:00Z'))).toBe(true);
    expect(pauseHolds(winter, JANUARY)).toBe(true);
    expect(pauseHolds(winter, Date.parse('2027-04-15T03:59:00Z'))).toBe(true);
    expect(pauseHolds(winter, Date.parse('2027-04-15T04:00:00Z'))).toBe(false);
    expect(pauseHolds(winter, JULY)).toBe(false);
    // One within a year.
    const summer = { from: '06-01', until: '09-01', timeZone: 'Europe/Oslo' };
    expect(pauseHolds(summer, JULY)).toBe(true);
    expect(pauseHolds(summer, JANUARY)).toBe(false);
  });

  it('says the month the scooters are back: the soonest, once every pause holds', () => {
    const early = { from: '12-01', until: '04-01', timeZone: 'America/Toronto' };
    expect(pausesReturn([winter, early], JANUARY)).toBe(4);
    expect(pausesReturn([winter, { ...early, until: '03-10' }], JANUARY)).toBe(3);
    expect(pausesReturn([winter, early], NOVEMBER)).toBeNull();
    expect(pausesReturn([], JANUARY)).toBeNull();
    expect(pausesReturn(undefined, JANUARY)).toBeNull();
  });
});

describe('a city with a winter pause', () => {
  it('keeps the pauses of its areas, and none where one area has scooters all year', () => {
    const city = (id: string) => REGIONAL_SCOOTER_CITIES.find(entry => entry.id === id);
    expect(city('ca:Montréal')?.pauses).toEqual([winter, { from: '12-01', until: '04-01', timeZone: 'America/Toronto' }]);
    expect(city('ca:Montréal')).not.toHaveProperty('seasonal');
    expect(city('ca:Laval')).not.toHaveProperty('pauses');
  });

  it('pauses a feed only when every area of it is in its pause', () => {
    expect(feedPaused('canada:bird_montreal', JANUARY)).toBe(true);
    expect(feedPaused('canada:bird_montreal', JULY)).toBe(false);
    // Lime runs in Laval all year.
    expect(feedPaused('canada:lime_quebec', JANUARY)).toBe(false);
    expect(feedPaused('national:lime_zurich', JANUARY)).toBe(false);
  });

  it('tells a rider in it when the scooters are back, once every operator has stopped', () => {
    expect(activeSeasonalPause(MONTREAL, JANUARY)).toEqual({ city: 'Montréal', month: 4 });
    // Lime runs until December.
    expect(activeSeasonalPause(MONTREAL, NOVEMBER)).toBeNull();
    expect(activeSeasonalPause(MONTREAL, JULY)).toBeNull();
    // Laval's bounds take in the north of Montréal: there, someone rides.
    expect(activeSeasonalPause([45.65, -73.6], JANUARY)).toBeNull();
    expect(activeSeasonalPause(LAVAL, JANUARY)).toBeNull();
    expect(activeSeasonalPause(null, JANUARY)).toBeNull();
  });

  it('has operators that are quiet rather than down', () => {
    const feed = (id: string, provider: string, changes: Partial<FeedSnapshot> = {}): FeedSnapshot => ({
      id, source: 'canada' as FeedSnapshot['source'], provider, coverage: [fixture.systems[0].bounds], vehicles: [],
      observedAt: JANUARY - 3_600_000, attemptedAt: JANUARY - 60_000, stale: false, failed: true, skipped: false, ...changes });
    const snapshot = (feeds: FeedSnapshot[]) => ({ version: 1 as const, updatedAt: JANUARY, feeds,
      overview: { generatedAt: JANUARY, feedIds: [], cities: [] } });
    const query = (providers: string[]) => ({ bounds: fixture.systems[0].bounds, minBattery: 0, providers: new Set(providers) });
    const bird = feed('canada:bird_montreal', 'bird');
    const lime = feed('canada:lime_quebec', 'lime', { coverage: [fixture.systems[0].bounds, fixture.laval.bounds] });

    // Bird, in its pause, failing: nothing to show, which is no failure.
    const quiet = querySnapshot(snapshot([bird, lime]), query(['bird']), 14, JANUARY);
    expect(quiet.vehicles).toEqual([]);
    expect(quiet.meta).toMatchObject({ failedSources: [], partial: false });
    expect(quiet.meta.sources).toMatchObject({ canada: 'skipped' });
    // Lime is not in its pause in Laval, so it is down.
    expect(() => querySnapshot(snapshot([bird, lime]), query(['bird', 'lime']), 14, JANUARY))
      .toThrow(expect.objectContaining({ failedSources: ['canada:lime_quebec'] }));
    // Bird back early is served.
    const vehicle = { provider: 'bird', lat: 45.5, lng: -73.57, battery: 80, range_m: null, vehicle_id: 'b1', deep_link: null, distance_m: null };
    const back = querySnapshot(snapshot([{ ...bird, failed: false, observedAt: JANUARY - 60_000, vehicles: [vehicle] }]),
      query(['bird']), 16, JANUARY);
    expect(back.vehicles).toHaveLength(1);
    expect(back.meta.sources).toMatchObject({ canada: 'fresh' });
    // Out of its pause, Bird failing is down.
    expect(() => querySnapshot(snapshot([{ ...bird, observedAt: JULY - 3_600_000 }]), query(['bird']), 14, JULY))
      .toThrow(expect.objectContaining({ failedSources: ['canada:bird_montreal'] }));
  });

  it('says so in the dock, in every language, with the month the scooters are back', () => {
    const input: DockInput = {
      count: 0, originInViewport: false, nearest: null, loading: null, failure: null, outOfDate: false, hasData: true,
      meta: { generatedAt: new Date(JANUARY).toISOString(), partial: false, stale: false, failedSources: [], sources: {},
        truncated: false, totalVehicles: 0, mode: 'vehicles', zoom: 14 },
      lastUpdated: JANUARY - 30_000, now: JANUARY, representedCount: 0, viewportProviders: ['bird', 'lime'],
      viewportCenter: MONTREAL, providerCounts: {}, providersInView: new Set(), enabledProviders: new Set(['bird', 'lime']),
      minBattery: 0, unfilteredCount: 0,
    };
    const model = dockModel(input);
    if (model.kind !== 'summary') throw new Error(`Expected the summary, got ${model.kind}`);
    const notice = model.notices.find(entry => entry.kind === 'season');
    expect(notice).toEqual({ kind: 'season', text: { key: 'dock.season', values: { city: 'Montréal' }, month: 4 } });
    expect(dockModel({ ...input, now: JULY, lastUpdated: JULY - 30_000 })).not.toMatchObject({ notices: [{ kind: 'season' }] });

    const say = (locale: AppLocale, region?: string) => formatUiText(notice!.text, { locale, region,
      t: (key, values) => translate(locale, key, values, region), formatNumber: String });
    expect(say('en')).toBe('Off season in Montréal: scooters are back in April');
    expect(say('de')).toBe('Saisonpause in Montréal: Scooter wieder im April');
    expect(say('fr')).toBe('Pause saisonnière à Montréal : retour des trottinettes en avril');
    expect(say('it')).toBe('Pausa stagionale a Montréal: monopattini di nuovo in aprile');
    expect(say('nb')).toBe('Sesongpause i Montréal: elsparkesykler igjen i april');
    expect(say('nl')).toBe('Seizoenspauze in Montréal: deelsteps weer in april');
    expect(say('pt')).toBe('Pausa sazonal em Montréal: trotinetes de volta em abril');
    expect(say('es')).toBe('Pausa de temporada en Montréal: los patinetes vuelven en abril');
    expect(say('es', 'MX')).toBe('Pausa de temporada en Montréal: los scooters vuelven en abril');
    expect(say('is')).toBe('Montréal: árstíðabundið hlé, rafskúturnar koma aftur í apríl');
  });
});

describe('a night ban', () => {
  it('curfews a feed only while it holds at every area of it', () => {
    // Dott in Trondheim: Friday 16 October 2026 at 23:30, Saturday at 05:00, and Monday at 23:30.
    expect(feedCurfewed('norway:dott_no_trondheim', Date.parse('2026-10-16T21:30:00Z'))).toBe(true);
    expect(feedCurfewed('norway:dott_no_trondheim', Date.parse('2026-10-17T03:00:00Z'))).toBe(false);
    expect(feedCurfewed('norway:dott_no_trondheim', Date.parse('2026-10-12T21:30:00Z'))).toBe(false);
    // Stjørdal, next door, bans no night.
    expect(feedCurfewed('norway:dott_no_stjordal', Date.parse('2026-10-16T21:30:00Z'))).toBe(false);
    // Kristiansand bans 00:00–05:00 after Friday and Saturday, Vennesla 00:00–04:00 every night.
    expect(feedCurfewed('norway:voi_no_kristiansand_vennesla', Date.parse('2026-10-16T22:30:00Z'))).toBe(true);
    expect(feedCurfewed('norway:voi_no_kristiansand_vennesla', Date.parse('2026-10-17T02:30:00Z'))).toBe(false);
    // Sandnes bans none, though Stavanger does.
    expect(feedCurfewed('norway:voi_no_stavanger_sandnes', Date.parse('2026-10-16T22:30:00Z'))).toBe(false);
    expect(feedCurfewed('national:voiscooters.com', Date.parse('2026-10-16T22:30:00Z'))).toBe(false);
  });
});
